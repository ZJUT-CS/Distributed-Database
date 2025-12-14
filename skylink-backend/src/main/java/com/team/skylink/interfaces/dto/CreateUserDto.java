package com.team.skylink.interfaces.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateUserDto {
    @NotBlank(message = "用户名不能为空")
    private String username;
    @Email(message = "邮箱格式不正确")
    private String email;
}

