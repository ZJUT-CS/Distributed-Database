package com.team.skylink.module.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.entity.Admin;
import com.team.skylink.module.admin.mapper.AdminMapper;
import com.team.skylink.module.refund.mapper.RefundChangeRecordMapper;
import com.team.skylink.module.system.mapper.ConfigMapper;
import com.team.skylink.module.system.mapper.OperationLogMapper;
import com.team.skylink.module.system.mapper.UserBehaviorStatMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AdminManagementServiceImpl implements AdminManagementService {
    private final AdminMapper adminMapper;
    private final ConfigMapper configMapper;
    private final OperationLogMapper operationLogMapper;
    private final UserBehaviorStatMapper userBehaviorStatMapper;
    private final RefundChangeRecordMapper refundChangeRecordMapper;
    private final PasswordEncoder passwordEncoder;

    public AdminManagementServiceImpl(
            AdminMapper adminMapper,
            ConfigMapper configMapper,
            OperationLogMapper operationLogMapper,
            UserBehaviorStatMapper userBehaviorStatMapper,
            RefundChangeRecordMapper refundChangeRecordMapper,
            PasswordEncoder passwordEncoder
    ) {
        this.adminMapper = adminMapper;
        this.configMapper = configMapper;
        this.operationLogMapper = operationLogMapper;
        this.userBehaviorStatMapper = userBehaviorStatMapper;
        this.refundChangeRecordMapper = refundChangeRecordMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Result<Admin> createAdmin(String adminAccount, String password) {
        Admin existing = adminMapper.selectOne(new QueryWrapper<Admin>().eq("admin_account", adminAccount));
        if (existing != null) {
            return Result.fail(409, "admin account already exists");
        }

        Admin admin = new Admin();
        admin.setAdminAccount(adminAccount);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole(2);
        admin.setCreateTime(System.currentTimeMillis());

        adminMapper.insert(admin);
        return Result.ok(admin);
    }

    @Override
    public Result<Long> adminCount() {
        return Result.ok(adminMapper.selectCount(null));
    }

    @Override
    public Result<Long> configCount() {
        return Result.ok(configMapper.selectCount(null));
    }

    @Override
    public Result<Long> operationLogCount() {
        return Result.ok(operationLogMapper.selectCount(null));
    }

    @Override
    public Result<Long> userBehaviorStatCount() {
        return Result.ok(userBehaviorStatMapper.selectCount(null));
    }

    @Override
    public Result<Long> changeRequestCount() {
        return Result.ok(refundChangeRecordMapper.selectCount(null));
    }
}

