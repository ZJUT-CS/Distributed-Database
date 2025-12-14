package com.team.skylink.application.service.impl;

import com.team.skylink.application.service.SeatService;
import com.team.skylink.infrastructure.persistence.mapper.SeatMapper;
import org.springframework.stereotype.Service;

@Service
public class SeatServiceImpl implements SeatService {
    private final SeatMapper mapper;

    public SeatServiceImpl(SeatMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public long count() {
        return mapper.selectCount(null);
    }
}

