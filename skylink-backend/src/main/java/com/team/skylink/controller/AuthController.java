package com.team.skylink.controller;

import com.team.skylink.application.service.AuthService;
import com.team.skylink.application.service.UserService;
import com.team.skylink.application.service.impl.AuthServiceImpl.LoginException;
import com.team.skylink.common.Result;
import com.team.skylink.interfaces.dto.CreateUserDto;
import com.team.skylink.interfaces.dto.LoginRequest;
import com.team.skylink.interfaces.dto.LoginResponse;
import com.team.skylink.domain.model.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        try {
            String ip = httpRequest.getRemoteAddr();
            LoginResponse response = authService.login(request, ip);
            return Result.ok(response);
        } catch (LoginException e) {
            String message = e.getMessage();
            return Result.fail(401, message);
        }
    }

    @PostMapping("/register")
    public Result<Boolean> register(@Valid @RequestBody CreateUserDto dto) {
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        boolean ok = userService.create(user);
        return Result.ok(ok);
    }
}

