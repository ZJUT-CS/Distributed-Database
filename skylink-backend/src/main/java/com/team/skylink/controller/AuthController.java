package com.team.skylink.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.entity.User;
import com.team.skylink.mapper.UserMapper;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final UserMapper userMapper;

    public AuthController(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @PostMapping("/login")
    public Result<String> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        if (username == null || password == null) {
            return Result.fail(400, "missing username or password");
        }
        User user = userMapper.selectOne(new QueryWrapper<User>().eq("username", username));
        if (user == null) {
            return Result.fail(401, "invalid username");
        }
        if (user.getPasswordHash() == null || !user.getPasswordHash().equals(password)) {
            return Result.fail(401, "invalid password");
        }
        return Result.ok("ok");
    }

    @PostMapping("/register")
    public Result<Boolean> register(@RequestBody User user) {
        int rows = userMapper.insert(user);
        return Result.ok(rows > 0);
    }
}
