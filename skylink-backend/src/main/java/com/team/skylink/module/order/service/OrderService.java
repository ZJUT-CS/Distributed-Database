package com.team.skylink.module.order.service;

import com.team.skylink.common.Result;
import com.team.skylink.module.order.dto.CreateOrderRequest;
import com.team.skylink.module.order.dto.OrderSearchResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderService {
    Result<List<OrderSearchResponse>> search(
            Long userId,
            Long orderNo,
            Integer orderStatus,
            LocalDateTime createTimeStart,
            LocalDateTime createTimeEnd,
            String flightNo,
            String cabinType
    );

    Result<OrderSearchResponse> create(CreateOrderRequest req);

    Result<Boolean> cancel(Long orderId);
}

