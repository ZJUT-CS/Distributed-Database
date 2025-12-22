package com.team.skylink.module.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.AdminConfigUpsertRequest;
import com.team.skylink.module.admin.service.AdminConfigService;
import com.team.skylink.module.system.entity.SystemConfig;
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

@RestController
@RequestMapping("/api/v1/admins/configs")
public class AdminConfigController {
    private final AdminConfigService adminConfigService;

    public AdminConfigController(AdminConfigService adminConfigService) {
        this.adminConfigService = adminConfigService;
    }

    @GetMapping
    public Result<PageResult<SystemConfig>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String keyword
    ) 
    {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<PageResult<SystemConfig>>) adminGuard;
        return adminConfigService.list(page, size, keyword);
    }

    @PostMapping
    public Result<SystemConfig> create(HttpServletRequest request, @Valid @RequestBody AdminConfigUpsertRequest body) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<SystemConfig>) adminGuard;
        return adminConfigService.create(parseAdminId(request), body);
    }

    @PutMapping("/{configId}")
    public Result<Boolean> update(
            HttpServletRequest request,
            @PathVariable("configId") Long configId,
            @Valid @RequestBody AdminConfigUpsertRequest body
    ) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;
        return adminConfigService.update(parseAdminId(request), configId, body);
    }

    @DeleteMapping("/{configId}")
    public Result<Boolean> delete(HttpServletRequest request, @PathVariable("configId") Long configId) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;
        return adminConfigService.delete(configId);
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

