package com.team.skylink.module.order.task;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.team.skylink.module.flight.service.SeatService;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
public class OrderTimeoutTask {

    private final OrderMapper orderMapper;
    private final SeatService seatService;
    private final long paymentTimeoutMinutes;

    public OrderTimeoutTask(
            OrderMapper orderMapper,
            SeatService seatService,
            @Value("${skylink.order.payment-timeout-minutes:30}") long paymentTimeoutMinutes
    ) {
        this.orderMapper = orderMapper;
        this.seatService = seatService;
        this.paymentTimeoutMinutes = paymentTimeoutMinutes;
    }

    /**
     * 每分钟检查一次超时未支付订单 (30分钟超时)
     * 状态 1 (PENDING_PAYMENT) -> 6 (CANCELLED)
     */
    @Scheduled(cron = "0 0/1 * * * ?")
    @Transactional(rollbackFor = Exception.class)
    public void cancelTimeoutOrders() {
        LocalDateTime timeoutThreshold = LocalDateTime.now().minusMinutes(paymentTimeoutMinutes);

        List<Orders> timeoutOrders = orderMapper.selectList(Wrappers.<Orders>lambdaQuery()
                .eq(Orders::getOrderStatus, 1) // 1=Pending Payment
                .isNotNull(Orders::getAuditTime)
                .lt(Orders::getAuditTime, timeoutThreshold));

        if (timeoutOrders.isEmpty()) return;

        log.info("Found {} timeout orders to delete", timeoutOrders.size());

        Set<Long> processedParents = new HashSet<>();
        for (Orders order : timeoutOrders) {
            try {
                if (order.getParentOrderId() != null) {
                    if (!processedParents.add(order.getParentOrderId())) {
                        continue;
                    }
                    List<Orders> siblings = orderMapper.selectList(Wrappers.<Orders>lambdaQuery()
                            .eq(Orders::getParentOrderId, order.getParentOrderId())
                            .eq(Orders::getOrderStatus, 1)
                            .isNotNull(Orders::getAuditTime)
                            .lt(Orders::getAuditTime, timeoutThreshold));

                    for (Orders sib : siblings) {
                        releaseSeatsForOrder(sib);
                        orderMapper.deleteById(sib.getOrderId());
                    }
                    log.info("Deleted timeout parent order: {}", order.getParentOrderId());
                    continue;
                }

                releaseSeatsForOrder(order);
                orderMapper.deleteById(order.getOrderId());
                log.info("Deleted order: {}", order.getOrderId());
            } catch (Exception e) {
                log.error("Failed to delete order: " + order.getOrderId(), e);
            }
        }
    }

    private void releaseSeatsForOrder(Orders order) {
        if (order == null) return;
        if (order.getSeatId() != null) {
            seatService.releaseSeat(order.getSeatId());
        } else if (order.getOrderId() != null) {
            seatService.releaseSeats(order.getOrderId());
        }
    }
}
