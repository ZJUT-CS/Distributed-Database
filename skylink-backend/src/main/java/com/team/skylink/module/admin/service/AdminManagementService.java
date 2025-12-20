package com.team.skylink.module.admin.service;

import com.team.skylink.common.Result;
import com.team.skylink.module.admin.entity.Admin;

public interface AdminManagementService {
    Result<Admin> createAdmin(String adminAccount, String password);

    Result<Long> adminCount();

    Result<Long> configCount();

    Result<Long> operationLogCount();

    Result<Long> userBehaviorStatCount();

    Result<Long> changeRequestCount();
}

