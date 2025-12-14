package com.team.skylink.application.service.impl;

import com.team.skylink.application.service.FlightDailyStatService;
import com.team.skylink.infrastructure.persistence.mapper.FlightDailyStatMapper;
import org.springframework.stereotype.Service;

@Service
public class FlightDailyStatServiceImpl implements FlightDailyStatService {
    private final FlightDailyStatMapper mapper;

    public FlightDailyStatServiceImpl(FlightDailyStatMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public long count() {
        return mapper.selectCount(null);
    }
}

