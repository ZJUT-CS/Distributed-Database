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
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
public class OrderTimeoutTask {

    private final OrderMapper orderMapper;
    private final SeatService seatService;

    // 构造函数 (移除了不用的配置项，保持代码整洁)
    public OrderTimeoutTask(OrderMapper orderMapper, SeatService seatService) {
        this.orderMapper = orderMapper;
        this.seatService = seatService;
    }

    /**
     * 超时订单扫描任务
     * 测试配置：每 10 秒执行一次
     */
    @Scheduled(cron = "0/10 * * * * ?") // --- 【关键点】每10秒跑一次，减少等待 ---
    @Transactional(rollbackFor = Exception.class)
    public void cancelTimeoutOrders() {
        // 设定超时规则：1分钟
        long actualTimeoutMinutes = 1;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime timeoutThreshold = now.minusMinutes(actualTimeoutMinutes);

        // --- 【调试日志】请在控制台观察此行，确保 'now' 是当前的北京时间 ---
        log.info("执行超时扫描 >> 当前系统时间: {}, 正在查找 {} 之前的未支付订单", now, timeoutThreshold);

        // 1. 查询所有超时未支付订单
        List<Orders> timeoutOrders = orderMapper.selectList(Wrappers.<Orders>lambdaQuery()
                .eq(Orders::getOrderStatus, 1) // 1=待支付
                .lt(Orders::getOrderTime, timeoutThreshold)); // 下单时间 < 2分钟前

        if (timeoutOrders.isEmpty()) {
            return;
        }

        log.info("发现 {} 个超时订单，准备清理...", timeoutOrders.size());

        Set<Long> processedParents = new HashSet<>();
        for (Orders order : timeoutOrders) {
            try {
                // 2. 优先处理联程/多人订单 (按父订单维度统一处理)
                if (order.getParentOrderId() != null) {
                    // 如果这个父订单ID已经处理过，直接跳过，防止重复取消
                    if (!processedParents.add(order.getParentOrderId())) {
                        continue;
                    }

                    // 找出该父订单下所有兄弟订单（无论是否各自超时，只要是待支付的都一起取消）
                    List<Orders> siblings = orderMapper.selectList(Wrappers.<Orders>lambdaQuery()
                            .eq(Orders::getParentOrderId, order.getParentOrderId())
                            .eq(Orders::getOrderStatus, 1));

                    for (Orders sib : siblings) {
                        releaseSeatsForOrder(sib); // 释放座位
                        // 使用 lambdaUpdate 仅更新状态，避免触发 ShardingSphere "Can not update sharding value" 错误
                        orderMapper.update(null, Wrappers.<Orders>lambdaUpdate()
                                .eq(Orders::getOrderId, sib.getOrderId())
                                .set(Orders::getOrderStatus, 6));
                    }
                    log.info("已级联取消父订单: {} 下的 {} 个子订单", order.getParentOrderId(), siblings.size());
                    continue;
                }

                // 3. 处理独立订单
                releaseSeatsForOrder(order);
                orderMapper.update(null, Wrappers.<Orders>lambdaUpdate()
                        .eq(Orders::getOrderId, order.getOrderId())
                        .set(Orders::getOrderStatus, 6));
                log.info("已取消独立订单: {}", order.getOrderId());

            } catch (Exception e) {
                log.error("订单取消失败 (ID: " + order.getOrderId() + ")", e);
            }
        }
    }

    /**
     * 释放座位的安全方法
     */
    private void releaseSeatsForOrder(Orders order) {
        if (order == null) return;
        try {
            // Mode B: 优先释放物理座位 ID
            if (order.getSeatId() != null) {
                seatService.releaseSeat(order.getSeatId());
                log.debug("座位已释放 SeatId: {}", order.getSeatId());
            } 
            // 兼容旧模式
            else if (order.getOrderId() != null) {
                seatService.releaseSeats(order.getOrderId());
            }
        } catch (Exception e) {
            // 吞掉释放座位的异常，确保主流程能继续把订单改成“已取消”
            log.warn("释放座位时出现异常 (OrderId: {}): {}", order.getOrderId(), e.getMessage());
        }
    }
}