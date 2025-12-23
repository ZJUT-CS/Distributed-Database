package com.team.skylink.module.admin.dto;

import lombok.Data;

@Data
public class AdminUserUpdateRequest {
    private String phoneNumber;
    private String email;
    private String realName;
    private String avatarUrl;
    private String idCard;
    private Integer gender;
    private Integer userStatus;
}

