package com.team.skylink.application.service.impl;

import com.team.skylink.application.service.ConfigService;
import com.team.skylink.infrastructure.persistence.mapper.ConfigMapper;
import org.springframework.stereotype.Service;

@Service
public class ConfigServiceImpl implements ConfigService {
    private final ConfigMapper mapper;

    public ConfigServiceImpl(ConfigMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public long count() {
        return mapper.selectCount(null);
    }
}

