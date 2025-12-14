package com.team.skylink.application.service.impl;

import com.team.skylink.application.service.ChangeRequestService;
import com.team.skylink.infrastructure.persistence.mapper.ChangeRequestMapper;
import org.springframework.stereotype.Service;

@Service
public class ChangeRequestServiceImpl implements ChangeRequestService {
    private final ChangeRequestMapper mapper;

    public ChangeRequestServiceImpl(ChangeRequestMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public long count() {
        return mapper.selectCount(null);
    }
}

