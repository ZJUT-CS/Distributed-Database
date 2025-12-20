package com.team.skylink.module.trade.service;

import com.team.skylink.common.Result;

public interface TradeService {
    Result<Long> orderCount();

    Result<Long> paymentCount();

    Result<Long> refundCount();
}

