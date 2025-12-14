package com.team.skylink.interfaces.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "用户名不能为空")
    @Pattern(regexp = "^[A-Za-z0-9_]{6,20}$", message = "用户名需为6-20位字母数字下划线")
    private String username;
    @NotBlank(message = "密码不能为空")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d]{8,32}$", message = "密码需8-32位且包含大小写字母和数字")
    private String password;
}

