package com.team.skylink.module.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.AdminConfigUpsertRequest;
import com.team.skylink.module.system.entity.SystemConfig;
import com.team.skylink.module.system.mapper.ConfigMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/configs")
public class AdminConfigController {
    private final ConfigMapper configMapper;

    public AdminConfigController(ConfigMapper configMapper) {
        this.configMapper = configMapper;
    }

    @GetMapping
    public Result<PageResult<SystemConfig>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String keyword
    ) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<PageResult<SystemConfig>>) adminGuard;

        int p = page != null && page > 0 ? page : 1;
        int s = size != null && size > 0 ? Math.min(size, 100) : 10;
        int offset = (p - 1) * s;

        QueryWrapper<SystemConfig> qw = new QueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) {
            String k = keyword.trim();
            qw.and(w -> w.like("config_name", k).or().like("config_desc", k));
        }
        qw.orderByDesc("update_time").orderByDesc("config_id");

        Long total = configMapper.selectCount(qw);
        qw.last("limit " + offset + "," + s);
        List<SystemConfig> items = configMapper.selectList(qw);
        return Result.ok(new PageResult<>(total != null ? total : 0, items));
    }

    @PostMapping
    public Result<SystemConfig> create(HttpServletRequest request, @Valid @RequestBody AdminConfigUpsertRequest body) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<SystemConfig>) adminGuard;

        SystemConfig c = new SystemConfig();
        c.setConfigName(body.getConfigName());
        c.setConfigValue(body.getConfigValue());
        c.setConfigDesc(body.getConfigDesc());
        c.setEffectiveTime(body.getEffectiveTime());
        c.setOperAdminId(parseAdminId(request));
        c.setUpdateTime(LocalDateTime.now());

        configMapper.insert(c);
        return Result.ok(c);
    }

    @PutMapping("/{configId}")
    public Result<Boolean> update(
            HttpServletRequest request,
            @PathVariable("configId") Long configId,
            @Valid @RequestBody AdminConfigUpsertRequest body
    ) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        if (configId == null) return Result.fail(400, "configId is required");
        SystemConfig c = configMapper.selectById(configId);
        if (c == null) return Result.fail(404, "config not found");

        c.setConfigName(body.getConfigName());
        c.setConfigValue(body.getConfigValue());
        c.setConfigDesc(body.getConfigDesc());
        c.setEffectiveTime(body.getEffectiveTime());
        c.setOperAdminId(parseAdminId(request));
        c.setUpdateTime(LocalDateTime.now());

        int rows = configMapper.updateById(c);
        return Result.ok(rows > 0);
    }

    @DeleteMapping("/{configId}")
    public Result<Boolean> delete(HttpServletRequest request, @PathVariable("configId") Long configId) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        if (configId == null) return Result.fail(400, "configId is required");
        int rows = configMapper.deleteById(configId);
        return Result.ok(rows > 0);
    }

    private static Result<?> ensureAdmin(HttpServletRequest request) {
        String t = request.getHeader("X-User-Type");
        if (t == null || (!"2".equals(t.trim()))) {
            return Result.fail(403, "admin required");
        }
        return null;
    }

    private static Long parseAdminId(HttpServletRequest request) {
        String v = request.getHeader("X-User-Id");
        if (v == null || v.isBlank()) return 0L;
        try {
            return Long.parseLong(v.trim());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}

