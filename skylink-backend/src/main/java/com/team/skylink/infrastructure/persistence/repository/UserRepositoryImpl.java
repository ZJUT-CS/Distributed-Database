package com.team.skylink.infrastructure.persistence.repository;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.team.skylink.domain.model.User;
import com.team.skylink.domain.repository.UserRepository;
import com.team.skylink.infrastructure.persistence.mapper.UserMapper;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepositoryImpl implements UserRepository {
    private final UserMapper userMapper;

    public UserRepositoryImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Override
    public User findById(Long id) {
        return userMapper.selectById(id);
    }

    @Override
    public User findByUsername(String username) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        return userMapper.selectOne(wrapper);
    }

    @Override
    public Page<User> page(int page, int size) {
        Page<User> p = new Page<>(page, size);
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        return userMapper.selectPage(p, wrapper);
    }

    @Override
    public boolean save(User user) {
        return userMapper.insert(user) > 0;
    }

    @Override
    public void update(User user) {
        userMapper.updateById(user);
    }
}
