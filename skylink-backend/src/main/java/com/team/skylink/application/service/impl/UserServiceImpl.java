package com.team.skylink.application.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.team.skylink.application.service.UserService;
import com.team.skylink.domain.model.User;
import com.team.skylink.domain.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User getById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public Page<User> page(int page, int size) {
        return userRepository.page(page, size);
    }

    @Override
    public boolean create(User user) {
        return userRepository.save(user);
    }
}

