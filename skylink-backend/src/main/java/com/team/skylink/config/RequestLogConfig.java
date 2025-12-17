package com.team.skylink.config;

import com.team.skylink.common.Result;
import com.team.skylink.entity.SystemLog;
import com.team.skylink.mapper.OperationLogMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import java.time.LocalDateTime;
import java.util.UUID;

@Configuration
public class RequestLogConfig implements WebMvcConfigurer {
    private final OperationLogMapper operationLogMapper;

    public RequestLogConfig(OperationLogMapper operationLogMapper) {
        this.operationLogMapper = operationLogMapper;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new RequestLogInterceptor(operationLogMapper)).addPathPatterns("/**")
                .excludePathPatterns(
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/actuator/**",
                        "/debug/**"
                );
    }

    static class RequestLogInterceptor implements HandlerInterceptor {
        private static final String ATTR_START_NS = "request_log_start_ns";
        private static final String ATTR_REQ_ID = "request_log_req_id";
        private static final String ATTR_API_CODE = "request_log_api_code";
        private static final String ATTR_API_MSG = "request_log_api_msg";

        private final OperationLogMapper operationLogMapper;

        RequestLogInterceptor(OperationLogMapper operationLogMapper) {
            this.operationLogMapper = operationLogMapper;
        }

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
            request.setAttribute(ATTR_START_NS, System.nanoTime());

            String requestId = request.getHeader("X-Request-Id");
            if (requestId == null || requestId.isBlank()) {
                requestId = UUID.randomUUID().toString();
            }
            request.setAttribute(ATTR_REQ_ID, requestId);
            response.setHeader("X-Request-Id", requestId);
            return true;
        }

        @Override
        public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
            Long startNs = (Long) request.getAttribute(ATTR_START_NS);
            long durationMs = startNs != null ? (System.nanoTime() - startNs) / 1_000_000 : -1;

            Integer apiCode = (Integer) request.getAttribute(ATTR_API_CODE);
            String apiMsg = (String) request.getAttribute(ATTR_API_MSG);

            int operResult;
            if (ex != null) {
                operResult = 0;
            } else if (apiCode != null && apiCode != 0) {
                operResult = 0;
            } else {
                operResult = 1;
            }

            String module = normalizeModule(request.getRequestURI());

            Long userId = parseLongHeader(request, "X-User-Id");
            if (userId == null) {
                userId = 0L;
            }

            Integer userType = parseIntHeader(request, "X-User-Type");
            if (userType == null || (userType != 1 && userType != 2)) {
                userType = 1;
            }

            String ip = clientIp(request);
            String query = request.getQueryString();
            String path = request.getRequestURI();
            String method = request.getMethod();
            String operType = normalizeOperType(method, path);
            String requestId = (String) request.getAttribute(ATTR_REQ_ID);
            String auth = request.getHeader("Authorization") != null ? "1" : "0";

            String content = method + " " + path
                    + (query != null && !query.isBlank() ? ("?" + query) : "")
                    + " durationMs=" + durationMs
                    + " code=" + (apiCode != null ? apiCode : -1)
                    + " auth=" + auth
                    + " rid=" + (requestId != null ? requestId : "");

            if (apiMsg != null && !apiMsg.isBlank()) {
                content = content + " msg=" + safeOneLine(apiMsg);
            }
            if (content.length() > 480) {
                content = content.substring(0, 480);
            }

            SystemLog log = new SystemLog();
            log.setOperUserType(userType);
            log.setOperUserId(userId);
            log.setOperModule(module);
            log.setOperType(operType);
            log.setOperContent(content);
            log.setOperIp(ip);
            log.setOperResult(operResult);
            log.setOperTime(LocalDateTime.now());

            try {
                operationLogMapper.insert(log);
            } catch (Exception ignored) {
            }
        }

        private static String clientIp(HttpServletRequest request) {
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                int comma = xff.indexOf(',');
                return (comma > 0 ? xff.substring(0, comma) : xff).trim();
            }
            return request.getRemoteAddr();
        }

        private static Long parseLongHeader(HttpServletRequest request, String name) {
            String v = request.getHeader(name);
            if (v == null || v.isBlank()) return null;
            try {
                return Long.parseLong(v.trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }

        private static Integer parseIntHeader(HttpServletRequest request, String name) {
            String v = request.getHeader(name);
            if (v == null || v.isBlank()) return null;
            try {
                return Integer.parseInt(v.trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }

        private static String safeOneLine(String s) {
            return s.replace('\n', ' ').replace('\r', ' ').trim();
        }

        private static String normalizeModule(String uri) {
            if (uri == null || uri.isBlank()) return "unknown";
            String normalized = uri;
            int q = normalized.indexOf('?');
            if (q >= 0) normalized = normalized.substring(0, q);
            if (normalized.startsWith("/")) normalized = normalized.substring(1);
            int slash = normalized.indexOf('/');
            String first = slash >= 0 ? normalized.substring(0, slash) : normalized;
            if (first.isBlank()) return "unknown";
            return switch (first) {
                case "flights" -> "flight";
                case "orders" -> "order";
                case "payments" -> "payment";
                case "auth" -> "user";
                case "refund-change" -> "order";
                case "admin" -> "config";
                default -> first;
            };
        }

        private static String normalizeOperType(String method, String path) {
            if (path != null) {
                String p = path.toLowerCase();
                if (p.contains("login")) return "login";
                if (p.contains("audit")) return "audit";
            }

            if (method == null) return "query";
            return switch (method.toUpperCase()) {
                case "GET" -> "query";
                case "POST" -> "add";
                case "PUT", "PATCH" -> "update";
                case "DELETE" -> "delete";
                default -> method.toLowerCase();
            };
        }
    }

    @RestControllerAdvice
    static class ApiResultCaptureAdvice implements ResponseBodyAdvice<Object> {
        @Override
        public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
            return true;
        }

        @Override
        public Object beforeBodyWrite(
                Object body,
                MethodParameter returnType,
                MediaType selectedContentType,
                Class<? extends HttpMessageConverter<?>> selectedConverterType,
                ServerHttpRequest request,
                ServerHttpResponse response
        ) {
            if (request instanceof org.springframework.http.server.ServletServerHttpRequest servletReq) {
                HttpServletRequest raw = servletReq.getServletRequest();

                if (body instanceof Result<?> r) {
                    raw.setAttribute(RequestLogInterceptor.ATTR_API_CODE, r.getCode());
                    raw.setAttribute(RequestLogInterceptor.ATTR_API_MSG, r.getMsg());

                    // 统一：当业务返回非0 code 时，将 HTTP status 设置为该 code（若在合法区间）
                    int code = r.getCode();
                    if (code >= 100 && code <= 599 && code != 200) {
                        try {
                            if (response instanceof org.springframework.http.server.ServletServerHttpResponse servletResp) {
                                HttpServletResponse rawResp = servletResp.getServletResponse();
                                rawResp.setStatus(code);
                            }
                        } catch (Exception ignored) {
                        }
                    }
                }
            }
            return body;
        }
    }
}
