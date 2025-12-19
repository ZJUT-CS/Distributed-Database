package com.team.skylink.dto;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;

@Data
public class AdminLoginRequest {
    @NotBlank(message = "username is required")
    private String username;

    @NotBlank(message = "password is required")
    private String password;
}
