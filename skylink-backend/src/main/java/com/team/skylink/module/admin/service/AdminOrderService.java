package com.team.skylink.module.admin.service;

import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.controller.AdminOrderController;

public interface AdminOrderService {
    Result<PageResult<AdminOrderController.AdminOrderItem>> list(
            Integer page,
            Integer size,
            Long orderNo,
            Long userId,
            Integer orderStatus,
            String flightNo
    );

    Result<Boolean> updateStatus(Long orderId, Integer orderStatus);

    Result<Boolean> cancel(Long orderId);

    Result<Boolean> delete(Long orderId);
}

