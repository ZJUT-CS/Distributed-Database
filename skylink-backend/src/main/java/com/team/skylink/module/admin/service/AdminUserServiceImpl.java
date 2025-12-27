package com.team.skylink.module.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.AdminUserCreateRequest;
import com.team.skylink.module.admin.dto.AdminUserResetPasswordRequest;
import com.team.skylink.module.admin.dto.AdminUserUpdateRequest;
import com.team.skylink.module.user.mapper.UserMapper;
import com.team.skylink.module.user.entity.User;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminUserServiceImpl implements AdminUserService {
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public AdminUserServiceImpl(UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Result<PageResult<User>> list(Integer page, Integer size, String keyword, Integer status) {
        int p = page != null && page > 0 ? page : 1;
        int s = size != null && size > 0 ? Math.min(size, 100) : 10;
        int offset = (p - 1) * s;

        // 注意：在 MySQL 开启 ONLY_FULL_GROUP_BY + 分库分表/代理环境下，COUNT(*) 查询被重写时
        // 可能会把 ORDER BY 列带入聚合查询的 SELECT 列表，从而触发 SQLSyntaxErrorException。
        // 所以 count 与 list 必须使用不同的 wrapper：count 不带 ORDER BY/LIMIT。
        QueryWrapper<User> countQw = new QueryWrapper<>();
        if (status != null) {
            countQw.eq("user_status", status);
        }
        if (keyword != null && !keyword.isBlank()) {
            String k = keyword.trim();
            countQw.and(w -> w.like("phone_number", k).or().like("real_name", k).or().like("email", k));
        }
        Long total = userMapper.selectCount(countQw);

        QueryWrapper<User> listQw = new QueryWrapper<>();
        if (status != null) {
            listQw.eq("user_status", status);
        }
        if (keyword != null && !keyword.isBlank()) {
            String k = keyword.trim();
            listQw.and(w -> w.like("phone_number", k).or().like("real_name", k).or().like("email", k));
        }
        listQw.orderByDesc("create_time");
        listQw.last("limit " + offset + "," + s);
        List<User> items = userMapper.selectList(listQw);
        return Result.ok(new PageResult<>(total != null ? total : 0, items));
    }

    @Override
    public Result<User> create(AdminUserCreateRequest req) {
        String phone = req.getPhoneNumber().trim();
        Long existing = userMapper.selectCount(new QueryWrapper<User>().eq("phone_number", phone));
        if (existing != null && existing > 0) {
            return Result.fail(409, "phone number already exists");
        }

        User u = new User();
        u.setPhoneNumber(phone);
        u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        u.setEmail(req.getEmail());
        u.setRealName(req.getRealName());
        u.setUserStatus(1);
        u.setCreateTime(LocalDateTime.now());
        userMapper.insert(u);
        return Result.ok(u);
    }

    @Override
    public Result<Boolean> update(Long userId, AdminUserUpdateRequest req) {
        if (userId == null) return Result.fail(400, "userId is required");
        User u = userMapper.selectById(userId);
        if (u == null) return Result.fail(404, "user not found");

        if (req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank()) {
            String phone = req.getPhoneNumber().trim();
            Long exists = userMapper.selectCount(new QueryWrapper<User>().eq("phone_number", phone).ne("user_id", userId));
            if (exists != null && exists > 0) return Result.fail(409, "phone number already exists");
            u.setPhoneNumber(phone);
        }
        if (req.getEmail() != null) u.setEmail(req.getEmail());
        if (req.getRealName() != null) u.setRealName(req.getRealName());
        if (req.getAvatarUrl() != null) u.setAvatarUrl(req.getAvatarUrl());
        if (req.getGender() != null) u.setGender(req.getGender());
        if (req.getIdCard() != null && !req.getIdCard().isBlank()) {
            if (u.getIdCard() != null && !u.getIdCard().isBlank()) {
                return Result.fail(409, "already verified");
            }
            u.setIdCard(req.getIdCard().trim());
        }
        if (req.getUserStatus() != null) u.setUserStatus(req.getUserStatus());

        int rows = userMapper.updateById(u);
        return Result.ok(rows > 0);
    }

    @Override
    public Result<Boolean> resetPassword(Long userId, AdminUserResetPasswordRequest req) {
        if (userId == null) return Result.fail(400, "userId is required");
        User u = userMapper.selectById(userId);
        if (u == null) return Result.fail(404, "user not found");

        // u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        // int rows = userMapper.updateById(u);
        
        int rows = userMapper.update(null, Wrappers.<User>lambdaUpdate()
                .eq(User::getUserId, userId)
                .set(User::getPasswordHash, passwordEncoder.encode(req.getPassword())));
                
        return Result.ok(rows > 0);
    }

    @Override
    public Result<Boolean> delete(Long userId) {
        if (userId == null) return Result.fail(400, "userId is required");
        int rows = userMapper.deleteById(userId);
        return Result.ok(rows > 0);
    }
}

