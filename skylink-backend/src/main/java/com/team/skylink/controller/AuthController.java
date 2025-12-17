package com.team.skylink.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.dto.AdminLoginRequest;
import com.team.skylink.dto.LoginRequest;
import com.team.skylink.dto.LoginResponse;
import com.team.skylink.dto.AdminRegisterRequest;
import com.team.skylink.entity.Admin;
import com.team.skylink.entity.User;
import com.team.skylink.mapper.AdminMapper;
import com.team.skylink.mapper.UserMapper;
import jakarta.validation.Valid;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/auth", "/api/v1/auth"})
public class AuthController {
    private final UserMapper userMapper;
    private final AdminMapper adminMapper;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserMapper userMapper, AdminMapper adminMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.adminMapper = adminMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        String phoneNumber = request.getPhoneNumber();
        String password = request.getPassword();

        User user = userMapper.selectOne(new QueryWrapper<User>().eq("phone_number", phoneNumber));
        if (user == null) {
            return Result.fail(401, "invalid phoneNumber");
        }

        if (user.getPasswordHash() == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            return Result.fail(401, "invalid password");
        }

        if (user.getUserStatus() != null && user.getUserStatus() != 1) {
            return Result.fail(423, "user is disabled");
        }

        // 用户表不记录最后登录时间字段，直接返回登录结果

        LoginResponse resp = new LoginResponse(
                user.getUserId(),
                user.getPhoneNumber(),
                "user",
                UUID.randomUUID().toString()
        );
        return Result.ok(resp);
    }

    @PostMapping("/admin/login")
    public Result<LoginResponse> adminLogin(@Valid @RequestBody AdminLoginRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();

        Admin admin = adminMapper.selectOne(new QueryWrapper<Admin>().eq("username", username));
        if (admin == null) {
            return Result.fail(401, "invalid username");
        }

        if (admin.getPasswordHash() == null || !passwordEncoder.matches(password, admin.getPasswordHash())) {
            return Result.fail(401, "invalid password");
        }

        long now = System.currentTimeMillis();
        admin.setLastLoginTime(now);
        adminMapper.updateById(admin);

        LoginResponse resp = new LoginResponse(
                admin.getAdminId(),
                admin.getUsername(),
                "admin",
                UUID.randomUUID().toString()
        );
        return Result.ok(resp);
    }

    @PostMapping("/admin/register")
    public Result<Boolean> adminRegister(@Valid @RequestBody AdminRegisterRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();
        Integer role = request.getRole();

        Admin existing = adminMapper.selectOne(new QueryWrapper<Admin>().eq("username", username));
        if (existing != null) {
            return Result.fail(409, "username already exists");
        }

        Admin admin = new Admin();
        admin.setUsername(username);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole(role != null ? role : 1);
        long now = System.currentTimeMillis();
        admin.setCreateTime(now);
        admin.setLastLoginTime(now);

        int rows = adminMapper.insert(admin);
        return Result.ok(rows > 0);
    }

    @PostMapping("/register")
    public Result<Boolean> register(@RequestBody Map<String, String> body) {
        return phoneRegister(body);
    }

    @PostMapping("/phone-register")
    public Result<Boolean> phoneRegister(@RequestBody Map<String, String> body) {
        String phoneNumber = body.get("phoneNumber");
        String password = body.get("password");
        String realName = body.get("realName");
        String email = body.get("email");
        String idCard = body.get("idCard");
        String genderStr = body.get("gender");
        String birthDateStr = body.get("birthDate");

        if (phoneNumber == null || password == null) {
            return Result.fail(400, "missing phoneNumber or password");
        }

        User existing = userMapper.selectOne(
                new QueryWrapper<User>().eq("phone_number", phoneNumber));
        if (existing != null) {
            return Result.fail(409, "phone number already registered");
        }

        User user = new User();
        user.setPhoneNumber(phoneNumber);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRealName(realName);
        user.setEmail(email);
        user.setIdCard(idCard);

        if (genderStr != null) {
            try {
                user.setGender(Integer.parseInt(genderStr));
            } catch (NumberFormatException ignored) {
                // 也可以考虑在这里记录日志
            }
        }

        // 用户表无出生日期字段，忽略 birthDate

        user.setUserStatus(1);
        LocalDateTime now = LocalDateTime.now();
        user.setCreateTime(now);

        int rows = userMapper.insert(user);
        return Result.ok(rows > 0);
    }
}
