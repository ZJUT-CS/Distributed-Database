package com.team.skylink.module.trade.service;

import com.team.skylink.common.Result;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.payment.mapper.PaymentMapper;
import com.team.skylink.module.refund.mapper.RefundRequestMapper;
import org.springframework.stereotype.Service;

@Service
public class TradeServiceImpl implements TradeService {
    private final OrderMapper orderMapper;
    private final PaymentMapper paymentMapper;
    private final RefundRequestMapper refundRequestMapper;

    public TradeServiceImpl(OrderMapper orderMapper, PaymentMapper paymentMapper, RefundRequestMapper refundRequestMapper) {
        this.orderMapper = orderMapper;
        this.paymentMapper = paymentMapper;
        this.refundRequestMapper = refundRequestMapper;
    }

    @Override
    public Result<Long> orderCount() {
        return Result.ok(orderMapper.selectCount(null));
    }

    @Override
    public Result<Long> paymentCount() {
        return Result.ok(paymentMapper.selectCount(null));
    }

    @Override
    public Result<Long> refundCount() {
        return Result.ok(refundRequestMapper.selectCount(null));
    }
}

