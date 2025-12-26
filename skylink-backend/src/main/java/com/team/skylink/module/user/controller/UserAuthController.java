package com.team.skylink.module.user.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.user.dto.LoginRequest;
import com.team.skylink.module.user.dto.LoginResponse;
import com.team.skylink.module.user.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserAuthController {
    private final AuthService authService;

    public UserAuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/sessions")
    public Result<LoginResponse> createSession(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}

