package com.team.skylink.module.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private Long id;
    private String displayName;
    private String role; // user | admin
    private String token;
}
