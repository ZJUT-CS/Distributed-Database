package com.team.skylink.dto;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;

@Data
public class LoginRequest {
    @NotBlank(message = "phoneNumber is required")
    private String phoneNumber;

    @NotBlank(message = "password is required")
    private String password;
}
