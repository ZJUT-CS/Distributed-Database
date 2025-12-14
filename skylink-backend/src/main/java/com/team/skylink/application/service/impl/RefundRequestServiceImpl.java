package com.team.skylink.application.service.impl;

import com.team.skylink.application.service.RefundRequestService;
import com.team.skylink.infrastructure.persistence.mapper.RefundRequestMapper;
import org.springframework.stereotype.Service;

@Service
public class RefundRequestServiceImpl implements RefundRequestService {
    private final RefundRequestMapper mapper;

    public RefundRequestServiceImpl(RefundRequestMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public long count() {
        return mapper.selectCount(null);
    }
}

