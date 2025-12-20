package com.team.skylink.module.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.AdminUserCreateRequest;
import com.team.skylink.module.admin.dto.AdminUserResetPasswordRequest;
import com.team.skylink.module.admin.dto.AdminUserUpdateRequest;
import com.team.skylink.module.auth.entity.User;
import com.team.skylink.module.auth.mapper.UserMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.crypto.password.PasswordEncoder;
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
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public AdminUserController(UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
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

        int p = page != null && page > 0 ? page : 1;
        int s = size != null && size > 0 ? Math.min(size, 100) : 10;
        int offset = (p - 1) * s;

        QueryWrapper<User> qw = new QueryWrapper<>();
        if (status != null) {
            qw.eq("user_status", status);
        }
        if (keyword != null && !keyword.isBlank()) {
            String k = keyword.trim();
            qw.and(w -> w.like("phone_number", k).or().like("real_name", k).or().like("email", k));
        }
        qw.orderByDesc("create_time");

        Long total = userMapper.selectCount(qw);
        qw.last("limit " + offset + "," + s);
        List<User> items = userMapper.selectList(qw);
        return Result.ok(new PageResult<>(total != null ? total : 0, items));
    }

    @PostMapping
    public Result<User> create(HttpServletRequest request, @Valid @RequestBody AdminUserCreateRequest req) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<User>) adminGuard;

        String phone = req.getPhoneNumber().trim();
        User existing = userMapper.selectOne(new QueryWrapper<User>().eq("phone_number", phone));
        if (existing != null) {
            return Result.fail(409, "phone number already exists");
        }

        User u = new User();
        u.setPhoneNumber(phone);
        u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        u.setEmail(req.getEmail());
        u.setRealName(req.getRealName());
        u.setUserStatus(1);
        u.setCreateTime(LocalDateTime.now());
        userMapper.insert(u);
        return Result.ok(u);
    }

    @PutMapping("/{userId}")
    public Result<Boolean> update(HttpServletRequest request, @PathVariable("userId") Long userId, @RequestBody AdminUserUpdateRequest req) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        if (userId == null) return Result.fail(400, "userId is required");
        User u = userMapper.selectById(userId);
        if (u == null) return Result.fail(404, "user not found");

        if (req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank()) {
            String phone = req.getPhoneNumber().trim();
            User exists = userMapper.selectOne(new QueryWrapper<User>().eq("phone_number", phone).ne("user_id", userId));
            if (exists != null) return Result.fail(409, "phone number already exists");
            u.setPhoneNumber(phone);
        }
        if (req.getEmail() != null) u.setEmail(req.getEmail());
        if (req.getRealName() != null) u.setRealName(req.getRealName());
        if (req.getUserStatus() != null) u.setUserStatus(req.getUserStatus());

        int rows = userMapper.updateById(u);
        return Result.ok(rows > 0);
    }

    @PutMapping("/{userId}/password")
    public Result<Boolean> resetPassword(
            HttpServletRequest request,
            @PathVariable("userId") Long userId,
            @Valid @RequestBody AdminUserResetPasswordRequest req
    ) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        if (userId == null) return Result.fail(400, "userId is required");
        User u = userMapper.selectById(userId);
        if (u == null) return Result.fail(404, "user not found");

        u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        int rows = userMapper.updateById(u);
        return Result.ok(rows > 0);
    }

    @DeleteMapping("/{userId}")
    public Result<Boolean> delete(HttpServletRequest request, @PathVariable("userId") Long userId) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        if (userId == null) return Result.fail(400, "userId is required");
        int rows = userMapper.deleteById(userId);
        return Result.ok(rows > 0);
    }

    private static Result<?> ensureAdmin(HttpServletRequest request) {
        String t = request.getHeader("X-User-Type");
        if (t == null || (!"2".equals(t.trim()))) {
            return Result.fail(403, "admin required");
        }
        return null;
    }
}

