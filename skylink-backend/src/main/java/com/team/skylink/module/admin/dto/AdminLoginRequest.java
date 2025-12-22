package com.team.skylink.module.admin.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class AdminLoginRequest {
    @NotBlank(message = "adminAccount is required")
    private String adminAccount;

    @NotBlank(message = "password is required")
    private String password;
}

