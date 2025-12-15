package com.team.skylink.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.entity.User;
import com.team.skylink.mapper.UserMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeParseException; // 引入异常类
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public Result<String> login(@RequestBody Map<String, String> body) {
        String phoneNumber = body.get("phoneNumber");
        String password = body.get("password");
        if (phoneNumber == null || password == null) {
            return Result.fail(400, "missing phoneNumber or password");
        }
        User user = userMapper.selectOne(new QueryWrapper<User>().eq("phone_number", phoneNumber));
        if (user == null) {
            return Result.fail(401, "invalid phoneNumber");
        }
        if (user.getPasswordHash() == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            return Result.fail(401, "invalid password");
        }
        return Result.ok("ok");
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

        // --- 修改开始 ---
        if (birthDateStr != null && !birthDateStr.isEmpty()) {
            try {
                // 1. 直接解析为 LocalDate
                LocalDate localDate = LocalDate.parse(birthDateStr);
                // 2. 直接设置，不再需要转换为 java.sql.Date
                user.setBirthDate(localDate);
            } catch (DateTimeParseException e) {
                // 如果日期格式错误（不是 yyyy-MM-dd），返回 400 错误
                return Result.fail(400, "Invalid birthDate format. Expected yyyy-MM-dd");
            }
        }
        // --- 修改结束 ---

        user.setUserStatus(1);
        long now = System.currentTimeMillis();
        user.setRegisterTime(now);
        user.setLastLoginTime(now);

        int rows = userMapper.insert(user);
        return Result.ok(rows > 0);
    }
}