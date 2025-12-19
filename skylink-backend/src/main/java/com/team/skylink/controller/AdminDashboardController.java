package com.team.skylink.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.dto.AdminDashboardMetricsResponse;
import com.team.skylink.entity.Flight;
import com.team.skylink.entity.Order;
import com.team.skylink.entity.Payment;
import com.team.skylink.entity.RefundChangeRecord;
import com.team.skylink.entity.User;
import com.team.skylink.mapper.AdminMapper;
import com.team.skylink.mapper.ConfigMapper;
import com.team.skylink.mapper.FlightMapper;
import com.team.skylink.mapper.OperationLogMapper;
import com.team.skylink.mapper.OrderMapper;
import com.team.skylink.mapper.PaymentMapper;
import com.team.skylink.mapper.RefundChangeRecordMapper;
import com.team.skylink.mapper.UserMapper;
import com.team.skylink.mapper.UserBehaviorStatMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {
    private final FlightMapper flightMapper;
    private final OrderMapper orderMapper;
    private final PaymentMapper paymentMapper;
    private final RefundChangeRecordMapper refundChangeRecordMapper;
    private final UserMapper userMapper;
    private final AdminMapper adminMapper;
    private final ConfigMapper configMapper;
    private final OperationLogMapper operationLogMapper;
    private final UserBehaviorStatMapper userBehaviorStatMapper;

    public AdminDashboardController(
            FlightMapper flightMapper,
            OrderMapper orderMapper,
            PaymentMapper paymentMapper,
            RefundChangeRecordMapper refundChangeRecordMapper,
            UserMapper userMapper,
            AdminMapper adminMapper,
            ConfigMapper configMapper,
            OperationLogMapper operationLogMapper,
            UserBehaviorStatMapper userBehaviorStatMapper
    ) {
        this.flightMapper = flightMapper;
        this.orderMapper = orderMapper;
        this.paymentMapper = paymentMapper;
        this.refundChangeRecordMapper = refundChangeRecordMapper;
        this.userMapper = userMapper;
        this.adminMapper = adminMapper;
        this.configMapper = configMapper;
        this.operationLogMapper = operationLogMapper;
        this.userBehaviorStatMapper = userBehaviorStatMapper;
    }

    // 批处理式指标接口：一次请求返回大盘需要的多个计数，减少网络开销
    @GetMapping("/metrics")
    public Result<AdminDashboardMetricsResponse> metrics() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime tomorrowStart = today.plusDays(1).atStartOfDay();

        AdminDashboardMetricsResponse r = new AdminDashboardMetricsResponse();
        r.setFlightCount(flightMapper.selectCount(null));
        r.setOrderCount(orderMapper.selectCount(null));
        r.setPaymentCount(paymentMapper.selectCount(null));
        r.setChangeRequestCount(refundChangeRecordMapper.selectCount(null));
        r.setAdminCount(adminMapper.selectCount(null));
        r.setConfigCount(configMapper.selectCount(null));
        r.setOperationLogCount(operationLogMapper.selectCount(null));
        r.setUserBehaviorStatCount(userBehaviorStatMapper.selectCount(null));

        r.setUserCount(userMapper.selectCount(null));

        r.setTodayOrderCount(orderMapper.selectCount(
                new QueryWrapper<Order>().ge("order_time", todayStart).lt("order_time", tomorrowStart)
        ));
        r.setTodayGmv(sumPaymentAmount(
                new QueryWrapper<Payment>()
                        .eq("payment_status", 1)
                        .ge("payment_time", todayStart)
                        .lt("payment_time", tomorrowStart)
        ));
        r.setTotalGmv(sumPaymentAmount(new QueryWrapper<Payment>().eq("payment_status", 1)));

        r.setTodayNewUsers(userMapper.selectCount(
                new QueryWrapper<User>().ge("create_time", todayStart).lt("create_time", tomorrowStart)
        ));

        r.setUpcomingFlights(flightMapper.selectCount(
                new QueryWrapper<Flight>()
                        .in("status", List.of(1, 3))
                        .ge("departure_time", now)
                        .lt("departure_time", now.plusHours(24))
        ));
        r.setPendingRefundAudits(refundChangeRecordMapper.selectCount(
                new QueryWrapper<RefundChangeRecord>().eq("audit_status", 0)
        ));

        r.setFlightStatusNormalCount(flightMapper.selectCount(new QueryWrapper<Flight>().eq("status", 1)));
        r.setFlightStatusCancelledCount(flightMapper.selectCount(new QueryWrapper<Flight>().eq("status", 2)));
        r.setFlightStatusDelayedCount(flightMapper.selectCount(new QueryWrapper<Flight>().eq("status", 3)));
        r.setFlightStatusDivertedCount(flightMapper.selectCount(new QueryWrapper<Flight>().eq("status", 4)));

        return Result.ok(r);
    }

    private BigDecimal sumPaymentAmount(QueryWrapper<Payment> qw) {
        QueryWrapper<Payment> q = qw == null ? new QueryWrapper<>() : qw;
        q.select("COALESCE(SUM(payment_amount), 0)");
        List<Object> objs = paymentMapper.selectObjs(q);
        if (objs == null || objs.isEmpty()) return BigDecimal.ZERO;
        Object v = objs.get(0);
        if (v == null) return BigDecimal.ZERO;
        if (v instanceof BigDecimal bd) return bd;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        if (v instanceof String s) {
            try {
                return new BigDecimal(s);
            } catch (NumberFormatException e) {
                return BigDecimal.ZERO;
            }
        }
        return BigDecimal.ZERO;
    }
}
