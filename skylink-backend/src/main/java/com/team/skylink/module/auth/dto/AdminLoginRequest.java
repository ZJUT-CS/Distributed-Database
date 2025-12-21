package com.team.skylink.module.auth.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class AdminLoginRequest {
    @NotBlank(message = "adminAccount is required")
    private String adminAccount; // 改名：username -> adminAccount

    @NotBlank(message = "password is required")
    private String password;
}