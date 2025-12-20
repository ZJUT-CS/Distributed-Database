package com.team.skylink.module.admin.service;

import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.AdminConfigUpsertRequest;
import com.team.skylink.module.system.entity.SystemConfig;

public interface AdminConfigService {
    Result<PageResult<SystemConfig>> list(Integer page, Integer size, String keyword);

    Result<SystemConfig> create(Long adminId, AdminConfigUpsertRequest body);

    Result<Boolean> update(Long adminId, Long configId, AdminConfigUpsertRequest body);

    Result<Boolean> delete(Long configId);
}

