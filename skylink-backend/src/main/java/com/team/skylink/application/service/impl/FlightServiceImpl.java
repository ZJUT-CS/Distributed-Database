package com.team.skylink.application.service.impl;

import com.team.skylink.application.service.FlightService;
import com.team.skylink.infrastructure.persistence.mapper.FlightMapper;
import org.springframework.stereotype.Service;

@Service
public class FlightServiceImpl implements FlightService {
    private final FlightMapper mapper;

    public FlightServiceImpl(FlightMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public long count() {
        return mapper.selectCount(null);
    }
}

