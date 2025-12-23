package com.team.skylink.module.order.task;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.SkyLinkApplication;
import com.team.skylink.module.flight.entity.Seat;
import com.team.skylink.module.flight.mapper.SeatMapper;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(classes = SkyLinkApplication.class)
@ActiveProfiles("test")
public class OrderTimeoutVerificationTest {

    @Autowired
    private OrderTimeoutTask orderTimeoutTask;

    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private SeatMapper seatMapper;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Test
    @Transactional
    public void testOrderTimeoutCancellation() {
        // 1. 准备测试数据
        // 模拟一个3分钟前创建的待支付订单
        Orders order = new Orders();
        order.setUserId(12345L);
        order.setFlightId(1001L);
        order.setCabinId(1L);
        order.setOrderStatus(1); // 待支付
        order.setTicketNum(1);
        order.setTotalAmount(new java.math.BigDecimal("1000"));
        order.setOrderTime(LocalDateTime.now().minusMinutes(3)); // 3分钟前，超过2分钟阈值
        orderMapper.insert(order);
        Long orderId = order.getOrderId();
        assertNotNull(orderId, "Order ID should not be null after insert");

        // 模拟关联的座位 (状态3=锁定)
        // 使用 JdbcTemplate 插入以绕过 H2 AUTO_INCREMENT 问题
        Long seatId = 99999L;
        jdbcTemplate.update("INSERT INTO seat (seat_id, flight_id, cabin_type, status, order_id) VALUES (?, ?, ?, ?, ?)",
                seatId, 1001L, "Y", 3, orderId);
        
        // 更新订单关联座位ID
        order.setSeatId(seatId);
        orderMapper.updateById(order);

        // 2. 执行超时取消任务
        System.out.println("Executing cancelTimeoutOrders...");
        orderTimeoutTask.cancelTimeoutOrders();

        // 3. 验证结果
        // 验证订单状态是否变为 6 (已取消)
        Orders updatedOrder = orderMapper.selectById(orderId);
        assertEquals(6, updatedOrder.getOrderStatus(), "Order status should be 6 (Cancelled)");

        // 验证座位是否释放 (状态变为 1=Available，且 orderId 为 null)
        Seat updatedSeat = seatMapper.selectById(seatId);
        assertEquals(1, updatedSeat.getStatus(), "Seat status should be 1 (Available)");
        // 注意：releaseSeat逻辑中会将 seat.orderId 置为 null
    }
}
