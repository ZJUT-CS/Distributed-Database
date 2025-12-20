package com.team.skylink.module.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminUserCreateRequest {
    @NotBlank(message = "phoneNumber is required")
    private String phoneNumber;

    @NotBlank(message = "password is required")
    private String password;

    private String email;

    private String realName;
}

