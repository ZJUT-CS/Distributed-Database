package com.team.skylink.interfaces.controller;

import com.team.skylink.application.service.UserBehaviorStatService;
import com.team.skylink.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user-behavior-stats")
public class UserBehaviorStatController {
    private final UserBehaviorStatService service;

    public UserBehaviorStatController(UserBehaviorStatService service) {
        this.service = service;
    }

    @GetMapping("/count")
    public Result<Long> count() {
        return Result.ok(service.count());
    }
}

