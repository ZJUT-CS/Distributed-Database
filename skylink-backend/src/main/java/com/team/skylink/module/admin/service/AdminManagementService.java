package com.team.skylink.module.admin.service;

import com.team.skylink.common.Result;
import com.team.skylink.module.admin.entity.Admin;
import com.team.skylink.module.system.entity.SystemLog;

import java.util.List;

public interface AdminManagementService {
    // 修改：增加了 role 参数
    Result<Admin> createAdmin(String adminAccount, String password, Integer role);

    Result<com.team.skylink.module.admin.dto.AdminLoginResponse> login(String adminAccount, String password);
    
    Result<Long> adminCount();

    Result<Long> configCount();

    Result<Long> operationLogCount();

    Result<Long> userBehaviorStatCount();

    Result<Long> changeRequestCount();

    // 新增：管理员列表
    Result<List<Admin>> listAdmins(String keyword);

    // 新增：更新管理员状态
    Result<Void> updateAdminStatus(Long adminId, Integer status);

    // 新增：删除管理员
    Result<Void> deleteAdmin(Long adminId);

    // 新增：重置密码
    Result<Void> resetAdminPassword(Long adminId, String newPassword);

    // 新增：系统日志列表
    Result<List<SystemLog>> listSystemLogs(String keyword, String module, Integer page, Integer size);
}
