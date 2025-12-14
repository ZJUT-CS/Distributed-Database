package com.team.skylink.domain.repository;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.team.skylink.domain.model.User;

public interface UserRepository {
    User findById(Long id);
    User findByUsername(String username);
    Page<User> page(int page, int size);
    boolean save(User user);
    void update(User user);
}
