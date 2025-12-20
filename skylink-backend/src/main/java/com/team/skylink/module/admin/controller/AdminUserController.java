package com.team.skylink.module.admin.controller;

import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.AdminUserCreateRequest;
import com.team.skylink.module.admin.dto.AdminUserResetPasswordRequest;
import com.team.skylink.module.admin.dto.AdminUserUpdateRequest;
import com.team.skylink.module.admin.service.AdminUserService;
import com.team.skylink.module.auth.entity.User;
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
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {
    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public Result<PageResult<User>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status
    ) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<PageResult<User>>) adminGuard;
        return adminUserService.list(page, size, keyword, status);
    }

    @PostMapping
    public Result<User> create(HttpServletRequest request, @Valid @RequestBody AdminUserCreateRequest req) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<User>) adminGuard;
        return adminUserService.create(req);
    }

    @PutMapping("/{userId}")
    public Result<Boolean> update(HttpServletRequest request, @PathVariable("userId") Long userId, @RequestBody AdminUserUpdateRequest req) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;
        return adminUserService.update(userId, req);
    }

    @PutMapping("/{userId}/password")
    public Result<Boolean> resetPassword(
            HttpServletRequest request,
            @PathVariable("userId") Long userId,
            @Valid @RequestBody AdminUserResetPasswordRequest req
    ) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;
        return adminUserService.resetPassword(userId, req);
    }

    @DeleteMapping("/{userId}")
    public Result<Boolean> delete(HttpServletRequest request, @PathVariable("userId") Long userId) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;
        return adminUserService.delete(userId);
    }

    private static Result<?> ensureAdmin(HttpServletRequest request) {
        String t = request.getHeader("X-User-Type");
        if (t == null || (!"2".equals(t.trim()))) {
            return Result.fail(403, "admin required");
        }
        return null;
    }
}

