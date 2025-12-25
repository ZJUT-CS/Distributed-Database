package com.team.skylink.module.system.controller;

import com.team.skylink.common.Result;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.errors.MinioException;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.model.ObjectMetadata;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class UploadController {

    @Value("${storage.provider:local}")
    private String storageProvider;

    @Value("${minio.endpoint:}")
    private String minioEndpoint;
    @Value("${minio.accessKey:}")
    private String minioAccessKey;
    @Value("${minio.secretKey:}")
    private String minioSecretKey;
    @Value("${minio.bucket:}")
    private String minioBucket;
    @Value("${minio.publicUrl:}")
    private String minioPublicUrl;

    @Value("${oss.endpoint:}")
    private String ossEndpoint;
    @Value("${oss.accessKeyId:}")
    private String ossAccessKeyId;
    @Value("${oss.accessKeySecret:}")
    private String ossAccessKeySecret;
    @Value("${oss.bucket:}")
    private String ossBucket;
    @Value("${oss.publicUrl:}")
    private String ossPublicUrl;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result<Map<String, Object>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return Result.fail(400, "missing file");
        }
        String original = file.getOriginalFilename();
        String ext = "";
        if (StringUtils.hasText(original) && original.contains(".")) {
            ext = original.substring(original.lastIndexOf(".")).toLowerCase();
        }
        String name = UUID.randomUUID().toString().replace("-", "") + ext;

        if ("minio".equalsIgnoreCase(storageProvider) && hasText(minioEndpoint, minioAccessKey, minioSecretKey, minioBucket)) {
            try (InputStream in = file.getInputStream()) {
                MinioClient client = MinioClient.builder()
                        .endpoint(minioEndpoint)
                        .credentials(minioAccessKey, minioSecretKey)
                        .build();
                String objectName = "images/" + name;
                String ct = file.getContentType();
                long len = file.getSize();
                client.putObject(
                        PutObjectArgs.builder()
                                .bucket(minioBucket)
                                .object(objectName)
                                .stream(in, len, -1)
                                .contentType(ct != null ? ct : MediaType.APPLICATION_OCTET_STREAM_VALUE)
                                .build()
                );
                String url = buildMinioPublicUrl(objectName);
                Map<String, Object> resp = new HashMap<>();
                resp.put("url", url);
                resp.put("name", name);
                resp.put("originalName", original);
                resp.put("size", file.getSize());
                return Result.ok(resp);
            } catch (Exception me) {
                return Result.fail(500, "minio error: " + me.getMessage());
            }
        }

        if ("oss".equalsIgnoreCase(storageProvider) && hasText(ossEndpoint, ossAccessKeyId, ossAccessKeySecret, ossBucket)) {
            try (InputStream in = file.getInputStream()) {
                OSS ossClient = new OSSClientBuilder().build(ossEndpoint, ossAccessKeyId, ossAccessKeySecret);
                String objectName = "images/" + name;
                ObjectMetadata metadata = new ObjectMetadata();
                String ct = file.getContentType();
                if (ct != null) metadata.setContentType(ct);
                metadata.setContentLength(file.getSize());
                ossClient.putObject(ossBucket, objectName, in, metadata);
                ossClient.shutdown();
                String url = buildOssPublicUrl(objectName);
                Map<String, Object> resp = new HashMap<>();
                resp.put("url", url);
                resp.put("name", name);
                resp.put("originalName", original);
                resp.put("size", file.getSize());
                return Result.ok(resp);
            } catch (Exception e) {
                return Result.fail(500, "oss error: " + e.getMessage());
            }
        }

        Path dir = Paths.get(System.getProperty("user.dir"), "uploads");
        Files.createDirectories(dir);
        Path target = dir.resolve(name);
        Files.write(target, file.getBytes());
        String url = "/uploads/" + name;
        Map<String, Object> resp = new HashMap<>();
        resp.put("url", url);
        resp.put("name", name);
        resp.put("originalName", original);
        resp.put("size", file.getSize());
        return Result.ok(resp);
    }

    private static boolean hasText(String... arr) {
        for (String s : arr) {
            if (!StringUtils.hasText(s)) return false;
        }
        return true;
    }

    private String buildMinioPublicUrl(String objectName) {
        if (StringUtils.hasText(minioPublicUrl)) {
            String base = minioPublicUrl.endsWith("/") ? minioPublicUrl.substring(0, minioPublicUrl.length() - 1) : minioPublicUrl;
            return base + "/" + objectName;
        }
        String base = minioEndpoint.endsWith("/") ? minioEndpoint.substring(0, minioEndpoint.length() - 1) : minioEndpoint;
        return base + "/" + minioBucket + "/" + objectName;
    }

    private String buildOssPublicUrl(String objectName) {
        if (StringUtils.hasText(ossPublicUrl)) {
            String base = ossPublicUrl.endsWith("/") ? ossPublicUrl.substring(0, ossPublicUrl.length() - 1) : ossPublicUrl;
            return base + "/" + objectName;
        }
        String base = ossEndpoint.endsWith("/") ? ossEndpoint.substring(0, ossEndpoint.length() - 1) : ossEndpoint;
        return base + "/" + ossBucket + "/" + objectName;
    }
}
