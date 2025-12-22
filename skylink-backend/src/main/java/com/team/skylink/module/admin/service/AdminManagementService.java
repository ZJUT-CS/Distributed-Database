package com.team.skylink.module.admin.service;

import com.team.skylink.common.Result;
import com.team.skylink.module.admin.entity.Admin;

public interface AdminManagementService {
    // 修改：增加了 role 参数
    Result<Admin> createAdmin(String adminAccount, String password, Integer role);

    Result<com.team.skylink.module.admin.dto.AdminLoginResponse> login(String adminAccount, String password);
    
    Result<Long> adminCount();

    Result<Long> configCount();

    Result<Long> operationLogCount();

    Result<Long> userBehaviorStatCount();

    Result<Long> changeRequestCount();
}
