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

import java.util.UUID; // 导入 UUID

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
    public Result<Admin> createAdmin(String adminAccount, String password, Integer role) {
        Admin existing = adminMapper.selectOne(new QueryWrapper<Admin>().eq("admin_account", adminAccount));
        if (existing != null) {
            return Result.fail(409, "admin account already exists");
        }

        Admin admin = new Admin();
        admin.setAdminAccount(adminAccount);
        admin.setPasswordHash(passwordEncoder.encode(password));
        // role 如果没传则默认为 1 (普通管理员)
        admin.setRole(role != null ? role : 1);
        admin.setCreateTime(System.currentTimeMillis());

        adminMapper.insert(admin);
        return Result.ok(admin);
    }

    // ▼▼▼▼▼▼ 新增：登录逻辑实现 ▼▼▼▼▼▼
    @Override
    public Result<com.team.skylink.module.admin.dto.AdminLoginResponse> login(String adminAccount, String password) {
        // 1. 查数据库
        Admin admin = adminMapper.selectOne(new QueryWrapper<Admin>().eq("admin_account", adminAccount));
        
        // 2. 账号不存在
        if (admin == null) {
            return Result.fail(401, "账号或密码错误");
        }

        // 3. 验证密码 (加密比对)
        if (!passwordEncoder.matches(password, admin.getPasswordHash())) {
            return Result.fail(401, "账号或密码错误");
        }

        // 4. 生成 Token (这里生成一个带前缀的 Mock Token)
        String token = "admin-token-" + UUID.randomUUID().toString();
        
        // (可选) 更新最后登录时间
        admin.setLastLoginTime(System.currentTimeMillis());
        adminMapper.updateById(admin);

        return Result.ok(new com.team.skylink.module.admin.dto.AdminLoginResponse(
                admin.getAdminId(),
                admin.getAdminAccount(),
                "admin",
                token,
                2,
                admin.getRole()
        ));
    }
    // ▲▲▲▲▲▲ 新增结束 ▲▲▲▲▲▲

    @Override
    public Result<Long> adminCount() { return Result.ok(adminMapper.selectCount(null)); }
    @Override
    public Result<Long> configCount() { return Result.ok(configMapper.selectCount(null)); }
    @Override
    public Result<Long> operationLogCount() { return Result.ok(operationLogMapper.selectCount(null)); }
    @Override
    public Result<Long> userBehaviorStatCount() { return Result.ok(userBehaviorStatMapper.selectCount(null)); }
    @Override
    public Result<Long> changeRequestCount() { return Result.ok(refundChangeRecordMapper.selectCount(null)); }
}
