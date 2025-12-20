package com.team.skylink.module.auth.dto;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;

@Data
public class AdminRegisterRequest {
    @NotBlank(message = "username is required")
    private String username;

    @NotBlank(message = "password is required")
    private String password;
    /** 可选：1=超级管理员，其他自定义 */
    private Integer role;
}
