package com.team.skylink.application.service.impl;

import com.team.skylink.application.service.AdminService;
import com.team.skylink.infrastructure.persistence.mapper.AdminMapper;
import org.springframework.stereotype.Service;

@Service
public class AdminServiceImpl implements AdminService {
    private final AdminMapper adminMapper;

    public AdminServiceImpl(AdminMapper adminMapper) {
        this.adminMapper = adminMapper;
    }

    @Override
    public long count() {
        return adminMapper.selectCount(null);
    }
}

