package com.team.skylink.application.service.impl;

import com.team.skylink.application.service.OrderService;
import com.team.skylink.infrastructure.persistence.mapper.OrderMapper;
import org.springframework.stereotype.Service;

@Service
public class OrderServiceImpl implements OrderService {
    private final OrderMapper mapper;

    public OrderServiceImpl(OrderMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public long count() {
        return mapper.selectCount(null);
    }
}

