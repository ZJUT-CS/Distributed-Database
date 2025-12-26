package com.team.skylink.module.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminUserResetPasswordRequest {
    @NotBlank(message = "password is required")
    private String password;
}

