package com.team.skylink.module.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.common.PageResult;
import com.team.skylink.module.admin.entity.Admin;
import com.team.skylink.module.admin.mapper.AdminMapper;
import com.team.skylink.module.refund.mapper.RefundChangeRecordMapper;
import com.team.skylink.module.system.mapper.ConfigMapper;
import com.team.skylink.module.system.mapper.OperationLogMapper;
import com.team.skylink.module.system.mapper.UserBehaviorStatMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

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
        admin.setRole(role != null ? role : 1);
        admin.setCreateTime(System.currentTimeMillis());

        adminMapper.insert(admin);
        return Result.ok(admin);
    }

    @Override
    public Result<com.team.skylink.module.admin.dto.AdminLoginResponse> login(String adminAccount, String password) {
        Admin admin = adminMapper.selectOne(new QueryWrapper<Admin>().eq("admin_account", adminAccount));
        
        if (admin == null) {
            return Result.fail(401, "账号或密码错误");
        }

        if (!passwordEncoder.matches(password, admin.getPasswordHash())) {
            return Result.fail(401, "账号或密码错误");
        }

        String token = "admin-token-" + UUID.randomUUID().toString();
        
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

    @Override
    public Result<java.util.List<Admin>> listAdmins(String keyword) {
        QueryWrapper<Admin> qw = new QueryWrapper<>();
        if (keyword != null && !keyword.trim().isEmpty()) {
            qw.like("admin_account", keyword.trim());
        }
        qw.orderByDesc("create_time");
        return Result.ok(adminMapper.selectList(qw));
    }

        @Override
        public Result<PageResult<Admin>> listAdminsPage(String keyword, Integer page, Integer size) {
            int p = page != null && page > 0 ? page : 1;
            int s = size != null && size > 0 ? Math.min(size, 100) : 10;
            int offset = (p - 1) * s;

            QueryWrapper<Admin> countQw = new QueryWrapper<>();
            if (keyword != null && !keyword.trim().isEmpty()) {
                countQw.like("admin_account", keyword.trim());
            }

            Long total = adminMapper.selectCount(countQw);
            long totalVal = total == null ? 0 : total;
            if (totalVal == 0) {
                return Result.ok(new PageResult<>(0, Collections.emptyList()));
            }

            QueryWrapper<Admin> listQw = new QueryWrapper<>();
            if (keyword != null && !keyword.trim().isEmpty()) {
                listQw.like("admin_account", keyword.trim());
            }
            listQw.orderByDesc("create_time");
            listQw.last("LIMIT " + offset + ", " + s);

            List<Admin> rows = adminMapper.selectList(listQw);
            return Result.ok(new PageResult<>(totalVal, rows));
        }

    @Override
    public Result<Void> updateAdminStatus(Long adminId, Integer status) {
        Admin admin = adminMapper.selectById(adminId);
        if (admin == null) {
            return Result.fail(404, "管理员不存在");
        }
        return Result.ok(null);
    }

    @Override
    public Result<Void> deleteAdmin(Long adminId) {
        Admin admin = adminMapper.selectById(adminId);
        if (admin == null) {
            return Result.fail(404, "管理员不存在");
        }
        if (admin.getRole() != null && admin.getRole() == 2) {
            return Result.fail(403, "不能删除超级管理员");
        }
        adminMapper.deleteById(adminId);
        return Result.ok(null);
    }

    @Override
    public Result<Void> resetAdminPassword(Long adminId, String newPassword) {
        Admin admin = adminMapper.selectById(adminId);
        if (admin == null) {
            return Result.fail(404, "管理员不存在");
        }
        admin.setPasswordHash(passwordEncoder.encode(newPassword));
        adminMapper.updateById(admin);
        return Result.ok(null);
    }

    @Override
    public Result<Admin> updateAdmin(Long adminId, String adminAccount, Integer role, String password) {
        Admin admin = adminMapper.selectById(adminId);
        if (admin == null) {
            return Result.fail(404, "管理员不存在");
        }
        
        if (adminAccount != null && !adminAccount.trim().isEmpty()) {
            Admin existing = adminMapper.selectOne(new QueryWrapper<Admin>()
                .eq("admin_account", adminAccount.trim())
                .ne("admin_id", adminId));
            if (existing != null) {
                return Result.fail(409, "账号已存在");
            }
            admin.setAdminAccount(adminAccount.trim());
        }
        
        if (role != null) {
            admin.setRole(role);
        }
        
        if (password != null && !password.trim().isEmpty()) {
            admin.setPasswordHash(passwordEncoder.encode(password.trim()));
        }
        
        adminMapper.updateById(admin);
        return Result.ok(admin);
    }

    @Override
    public Result<PageResult<com.team.skylink.module.system.entity.SystemLog>> listSystemLogs(
            Long adminId,
            String keyword,
            String module,
            Integer operResult,
            Integer page,
            Integer size
    ) {
        int p = page != null && page > 0 ? page : 1;
        int s = size != null && size > 0 ? Math.min(size, 100) : 20;
        int offset = (p - 1) * s;

        QueryWrapper<com.team.skylink.module.system.entity.SystemLog> countQw = new QueryWrapper<>();
        if (adminId != null) {
            countQw.eq("oper_user_id", adminId);
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            countQw.and(w -> w.like("oper_content", kw).or().like("oper_ip", kw));
        }
        if (module != null && !module.trim().isEmpty()) {
            countQw.eq("oper_module", module.trim());
        }
        if (operResult != null) {
            countQw.eq("oper_result", operResult);
        }

        Long total = operationLogMapper.selectCount(countQw);

        QueryWrapper<com.team.skylink.module.system.entity.SystemLog> listQw = new QueryWrapper<>();
        if (adminId != null) {
            listQw.eq("oper_user_id", adminId);
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            listQw.and(w -> w.like("oper_content", kw).or().like("oper_ip", kw));
        }
        if (module != null && !module.trim().isEmpty()) {
            listQw.eq("oper_module", module.trim());
        }
        if (operResult != null) {
            listQw.eq("oper_result", operResult);
        }
        listQw.orderByDesc("oper_time");
        listQw.last("LIMIT " + offset + ", " + s);

        java.util.List<com.team.skylink.module.system.entity.SystemLog> rows = operationLogMapper.selectList(listQw);
        return Result.ok(new PageResult<>(total != null ? total : 0, rows));
    }
}
