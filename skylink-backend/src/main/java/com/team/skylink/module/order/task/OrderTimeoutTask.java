package com.team.skylink.module.order.task;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.team.skylink.module.flight.service.SeatService;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
public class OrderTimeoutTask {

    private final OrderMapper orderMapper;
    private final SeatService seatService;

    public OrderTimeoutTask(OrderMapper orderMapper, SeatService seatService) {
        this.orderMapper = orderMapper;
        this.seatService = seatService;
    }

    /**
     * 每分钟检查一次超时未支付订单 (30分钟超时)
     * 状态 1 (PENDING_PAYMENT) -> 6 (CANCELLED)
     */
    @Scheduled(cron = "0 0/1 * * * ?")
    @Transactional(rollbackFor = Exception.class)
    public void cancelTimeoutOrders() {
        LocalDateTime timeoutThreshold = LocalDateTime.now().minusMinutes(2);

        List<Orders> timeoutOrders = orderMapper.selectList(Wrappers.<Orders>lambdaQuery()
                .eq(Orders::getOrderStatus, 1) // 1=Pending Payment
                .lt(Orders::getOrderTime, timeoutThreshold));

        if (timeoutOrders.isEmpty()) return;

        log.info("Found {} timeout orders to cancel", timeoutOrders.size());

        for (Orders order : timeoutOrders) {
            try {
                // 1. Release seat by seatId (Mode B)
                if (order.getSeatId() != null) {
                    seatService.releaseSeat(order.getSeatId());
                } else {
                    // fallback: release by orderId if seatId is missing
                    seatService.releaseSeats(order.getOrderId());
                }
                
                // 2. Update order status
                order.setOrderStatus(6); // 6=Cancelled
                order.setUpdateTime(LocalDateTime.now());
                orderMapper.updateById(order);
                
                log.info("Cancelled order: {}", order.getOrderId());
            } catch (Exception e) {
                log.error("Failed to cancel order: " + order.getOrderId(), e);
            }
        }
    }

}
