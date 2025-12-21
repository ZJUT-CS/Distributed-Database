package com.team.skylink.module.admin.service;

import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.AdminUserCreateRequest;
import com.team.skylink.module.admin.dto.AdminUserResetPasswordRequest;
import com.team.skylink.module.admin.dto.AdminUserUpdateRequest;
import com.team.skylink.module.user.entity.User;

public interface AdminUserService {
    Result<PageResult<User>> list(Integer page, Integer size, String keyword, Integer status);

    Result<User> create(AdminUserCreateRequest req);

    Result<Boolean> update(Long userId, AdminUserUpdateRequest req);

    Result<Boolean> resetPassword(Long userId, AdminUserResetPasswordRequest req);

    Result<Boolean> delete(Long userId);
}

