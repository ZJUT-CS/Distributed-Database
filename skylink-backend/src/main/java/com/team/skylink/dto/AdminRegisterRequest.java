package com.team.skylink.dto;

import lombok.Data;

@Data
public class AdminRegisterRequest {
    private String username;
    private String password;
    /** 可选：1=超级管理员，其他自定义 */
    private Integer role;
}
