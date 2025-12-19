package com.team.skylink.dto;

import lombok.Data;

@Data
public class AdminUserUpdateRequest {
    private String phoneNumber;
    private String email;
    private String realName;
    private Integer userStatus;
}

