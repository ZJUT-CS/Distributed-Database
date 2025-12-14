package com.team.skylink.application.service.impl;

import com.team.skylink.application.service.OperationLogService;
import com.team.skylink.infrastructure.persistence.mapper.OperationLogMapper;
import org.springframework.stereotype.Service;

@Service
public class OperationLogServiceImpl implements OperationLogService {
    private final OperationLogMapper mapper;

    public OperationLogServiceImpl(OperationLogMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public long count() {
        return mapper.selectCount(null);
    }
}

