package com.team.skylink.application.service.impl;

import com.team.skylink.application.service.PaymentService;
import com.team.skylink.infrastructure.persistence.mapper.PaymentMapper;
import org.springframework.stereotype.Service;

@Service
public class PaymentServiceImpl implements PaymentService {
    private final PaymentMapper mapper;

    public PaymentServiceImpl(PaymentMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public long count() {
        return mapper.selectCount(null);
    }
}

