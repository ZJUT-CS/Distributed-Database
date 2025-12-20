package com.team.skylink.module.system.service;

import com.team.skylink.common.Result;
import com.team.skylink.module.flight.mapper.FlightMapper;
import org.springframework.stereotype.Service;

@Service
public class GlobalServiceImpl implements GlobalService {
    private final FlightMapper flightMapper;

    public GlobalServiceImpl(FlightMapper flightMapper) {
        this.flightMapper = flightMapper;
    }

    @Override
    public Result<Long> flightCount() {
        return Result.ok(flightMapper.selectCount(null));
    }
}

