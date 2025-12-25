package com.team.skylink.module.admin.service;

import com.team.skylink.common.Result;
import com.team.skylink.common.PageResult;
import com.team.skylink.module.admin.entity.Admin;
import com.team.skylink.module.system.entity.SystemLog;

import java.util.List;

public interface AdminManagementService {
    Result<Admin> createAdmin(String adminAccount, String password, Integer role);

    Result<com.team.skylink.module.admin.dto.AdminLoginResponse> login(String adminAccount, String password);
    
    Result<Long> adminCount();

    Result<Long> configCount();

    Result<Long> operationLogCount();

    Result<Long> userBehaviorStatCount();

    Result<Long> changeRequestCount();

    Result<List<Admin>> listAdmins(String keyword);

    Result<PageResult<Admin>> listAdminsPage(String keyword, Integer page, Integer size);

    Result<Void> updateAdminStatus(Long adminId, Integer status);

    Result<Void> deleteAdmin(Long adminId);

    Result<Void> resetAdminPassword(Long adminId, String newPassword);

    Result<Admin> updateAdmin(Long adminId, String adminAccount, Integer role, String password);

    Result<PageResult<SystemLog>> listSystemLogs(Long adminId, String keyword, String module, Integer operResult, Integer page, Integer size);
}
