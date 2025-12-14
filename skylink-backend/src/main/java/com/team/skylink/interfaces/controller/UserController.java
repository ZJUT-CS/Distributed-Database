package com.team.skylink.interfaces.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.team.skylink.application.service.UserService;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.domain.model.User;
import com.team.skylink.interfaces.dto.CreateUserDto;
import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@Validated
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public Result<User> get(@PathVariable Long id) {
        User user = userService.getById(id);
        return Result.ok(user);
    }

    @GetMapping
    public Result<PageResult<User>> page(@RequestParam(defaultValue = "1") int page,
                                         @RequestParam(defaultValue = "10") int size) {
        Page<User> p = userService.page(page, size);
        return Result.ok(new PageResult<>(p.getTotal(), p.getRecords()));
    }

    @PostMapping
    public Result<Boolean> create(@Valid @RequestBody CreateUserDto dto) {
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        boolean ok = userService.create(user);
        return Result.ok(ok);
    }
}

