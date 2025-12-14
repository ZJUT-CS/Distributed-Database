package com.team.skylink.application.service.impl;

import com.team.skylink.application.service.UserBehaviorStatService;
import com.team.skylink.infrastructure.persistence.mapper.UserBehaviorStatMapper;
import org.springframework.stereotype.Service;

@Service
public class UserBehaviorStatServiceImpl implements UserBehaviorStatService {
    private final UserBehaviorStatMapper mapper;

    public UserBehaviorStatServiceImpl(UserBehaviorStatMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public long count() {
        return mapper.selectCount(null);
    }
}

