package com.team.skylink.interfaces.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private UserBasicInfo user;
}

