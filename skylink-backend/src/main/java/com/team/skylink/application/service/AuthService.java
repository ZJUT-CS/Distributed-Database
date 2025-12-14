package com.team.skylink.application.service;

import com.team.skylink.interfaces.dto.LoginRequest;
import com.team.skylink.interfaces.dto.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request, String clientIp);
}

