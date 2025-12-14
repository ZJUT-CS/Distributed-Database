package com.team.skylink.interfaces.controller;

import com.team.skylink.common.Result;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @PostMapping("/login")
    public Result<String> login(@RequestParam @NotBlank String username,
                                @RequestParam @NotBlank String password) {
        return Result.ok("ok");
    }
}

