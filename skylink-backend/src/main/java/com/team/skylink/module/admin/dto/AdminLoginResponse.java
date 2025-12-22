package com.team.skylink.module.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminLoginResponse {
    private Long id;
    private String displayName;
    private String role; // admin
    private String token;
    private Integer userType; // 2
    private Integer adminRole; // 1 普通管理员；2 超级管理员
}
