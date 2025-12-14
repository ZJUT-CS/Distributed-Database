package com.team.skylink.application.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.team.skylink.domain.model.User;

public interface UserService {
    User getById(Long id);
    Page<User> page(int page, int size);
    boolean create(User user);
}

