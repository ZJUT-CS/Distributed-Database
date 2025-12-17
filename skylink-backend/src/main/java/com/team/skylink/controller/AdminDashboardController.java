package com.team.skylink.controller;

import com.team.skylink.common.Result;
import com.team.skylink.dto.AdminDashboardMetricsResponse;
import com.team.skylink.mapper.AdminMapper;
import com.team.skylink.mapper.ConfigMapper;
import com.team.skylink.mapper.FlightMapper;
import com.team.skylink.mapper.OperationLogMapper;
import com.team.skylink.mapper.OrderMapper;
import com.team.skylink.mapper.PaymentMapper;
import com.team.skylink.mapper.RefundChangeRecordMapper;
import com.team.skylink.mapper.UserBehaviorStatMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {
    private final FlightMapper flightMapper;
    private final OrderMapper orderMapper;
    private final PaymentMapper paymentMapper;
    private final RefundChangeRecordMapper refundChangeRecordMapper;
    private final AdminMapper adminMapper;
    private final ConfigMapper configMapper;
    private final OperationLogMapper operationLogMapper;
    private final UserBehaviorStatMapper userBehaviorStatMapper;

    public AdminDashboardController(
            FlightMapper flightMapper,
            OrderMapper orderMapper,
            PaymentMapper paymentMapper,
            RefundChangeRecordMapper refundChangeRecordMapper,
            AdminMapper adminMapper,
            ConfigMapper configMapper,
            OperationLogMapper operationLogMapper,
            UserBehaviorStatMapper userBehaviorStatMapper
    ) {
        this.flightMapper = flightMapper;
        this.orderMapper = orderMapper;
        this.paymentMapper = paymentMapper;
        this.refundChangeRecordMapper = refundChangeRecordMapper;
        this.adminMapper = adminMapper;
        this.configMapper = configMapper;
        this.operationLogMapper = operationLogMapper;
        this.userBehaviorStatMapper = userBehaviorStatMapper;
    }

    // 批处理式指标接口：一次请求返回大盘需要的多个计数，减少网络开销
    @GetMapping("/metrics")
    public Result<AdminDashboardMetricsResponse> metrics() {
        AdminDashboardMetricsResponse r = new AdminDashboardMetricsResponse();
        r.setFlightCount(flightMapper.selectCount(null));
        r.setOrderCount(orderMapper.selectCount(null));
        r.setPaymentCount(paymentMapper.selectCount(null));
        r.setChangeRequestCount(refundChangeRecordMapper.selectCount(null));
        r.setAdminCount(adminMapper.selectCount(null));
        r.setConfigCount(configMapper.selectCount(null));
        r.setOperationLogCount(operationLogMapper.selectCount(null));
        r.setUserBehaviorStatCount(userBehaviorStatMapper.selectCount(null));
        return Result.ok(r);
    }
}
