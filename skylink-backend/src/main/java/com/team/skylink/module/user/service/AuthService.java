package com.team.skylink.module.user.service;

import com.team.skylink.common.Result;
import com.team.skylink.module.user.dto.LoginRequest;
import com.team.skylink.module.user.dto.LoginResponse;
import com.team.skylink.module.user.entity.User;

import java.util.Map;

public interface AuthService {
    Result<LoginResponse> login(LoginRequest request);
    Result<Boolean> phoneRegister(Map<String, String> body);
    Result<User> getUserById(Long userId);
    Result<User> updateProfile(Long userId, String email, String avatarUrl, Integer gender, String realName, String idCard);
    Result<User> bindEmail(Long userId, String value, String code);
    Result<User> bindPhone(Long userId, String value, String code);
    Result<Boolean> changePassword(Long userId, String oldPassword, String newPassword);
}

