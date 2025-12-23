package com.team.skylink.module.admin.controller;

import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.AdminUserCreateRequest;
import com.team.skylink.module.admin.dto.AdminUserView;
import com.team.skylink.module.admin.dto.AdminUserResetPasswordRequest;
import com.team.skylink.module.admin.dto.AdminUserUpdateRequest;
import com.team.skylink.module.admin.service.AdminUserService;
import com.team.skylink.module.user.entity.User;

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
@RequestMapping("/api/v1/admins/users")
public class AdminUserController {
    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public Result<PageResult<AdminUserView>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status
    ) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<PageResult<AdminUserView>>) adminGuard;
        Result<PageResult<User>> r = adminUserService.list(page, size, keyword, status);
        if (r == null) return Result.fail(500, "internal error");
        if (r.getCode() != 0) return Result.fail(r.getCode(), r.getMsg());
        PageResult<User> pr = r.getData();
        if (pr == null) return Result.ok(new PageResult<>(0, java.util.Collections.emptyList()));

        java.util.List<AdminUserView> views = new java.util.ArrayList<>();
        if (pr.getData() != null) {
            for (User u : pr.getData()) {
                views.add(toView(u));
            }
        }
        return Result.ok(new PageResult<>(pr.getTotal(), views));
    }

    @PostMapping
    public Result<AdminUserView> create(HttpServletRequest request, @Valid @RequestBody AdminUserCreateRequest req) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<AdminUserView>) adminGuard;
        Result<User> r = adminUserService.create(req);
        if (r == null) return Result.fail(500, "internal error");
        if (r.getCode() != 0) return Result.fail(r.getCode(), r.getMsg());
        return Result.ok(toView(r.getData()));
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

    private static AdminUserView toView(User u) {
        if (u == null) return null;
        AdminUserView v = new AdminUserView();
        v.setUserId(u.getUserId());
        v.setPhoneNumber(u.getPhoneNumber());
        v.setRealName(u.getRealName());
        v.setEmail(u.getEmail());
        v.setAvatarUrl(u.getAvatarUrl());
        v.setGender(u.getGender());
        v.setUserStatus(u.getUserStatus());
        v.setCreateTime(u.getCreateTime());

        String id = u.getIdCard();
        boolean present = id != null && !id.isBlank();
        v.setIdCardPresent(present);
        v.setIdCardMasked(maskIdCard(id));
        return v;
    }

    private static String maskIdCard(String idCard) {
        if (idCard == null) return null;
        String s = idCard.trim();
        if (s.isEmpty()) return null;
        if (s.length() <= 8) return s;
        return s.substring(0, 6) + "********" + s.substring(s.length() - 2);
    }
}

