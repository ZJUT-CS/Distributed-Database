package com.team.skylink.module.order.service;

import com.team.skylink.common.Result;
import com.team.skylink.common.PageResult;
import com.team.skylink.module.order.dto.CreateOrderRequest;
import com.team.skylink.module.order.dto.OrderSearchResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderService {
    Result<PageResult<OrderSearchResponse>> search(
            Long userId,
            Long orderNo,
            Integer orderStatus,
            LocalDateTime createTimeStart,
            LocalDateTime createTimeEnd,
            String flightNo,
            String cabinType,
            int page,
            int size
    );

    Result<OrderSearchResponse> create(CreateOrderRequest req);

    Result<Boolean> cancel(Long orderId);

    Result<Boolean> audit(Long orderId, boolean approved);

    Result<List<OrderSearchResponse>> listMyOrders(Long userId);

    Result<OrderSearchResponse> selectSeat(Long orderId, Long seatId);
}

