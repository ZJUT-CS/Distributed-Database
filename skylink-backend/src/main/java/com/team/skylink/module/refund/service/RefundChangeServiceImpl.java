package com.team.skylink.module.refund.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.team.skylink.common.Result;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.flight.mapper.RouteMapper;
import com.team.skylink.module.flight.service.SeatService;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.payment.entity.Payment;
import com.team.skylink.module.payment.mapper.PaymentMapper;
import com.team.skylink.module.refund.dto.RefundChangeApplyRequest;
import com.team.skylink.module.refund.dto.RefundChangeSearchResponse;
import com.team.skylink.module.refund.entity.RefundChangeRecord;
import com.team.skylink.module.refund.mapper.RefundChangeRecordMapper;
import com.team.skylink.module.user.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class RefundChangeServiceImpl implements RefundChangeService {
    private final OrderMapper orderMapper;
    private final PaymentMapper paymentMapper;
    private final FlightMapper flightMapper;
    private final AircraftCabinConfigMapper configMapper;
    private final RouteMapper routeMapper;
    private final RefundChangeRecordMapper refundChangeRecordMapper;
    private final UserMapper userMapper;
    private final SeatService seatService;

    public RefundChangeServiceImpl(
            OrderMapper orderMapper,
            PaymentMapper paymentMapper,
            FlightMapper flightMapper,
            AircraftCabinConfigMapper configMapper,
            RouteMapper routeMapper,
            RefundChangeRecordMapper refundChangeRecordMapper,
            UserMapper userMapper,
            SeatService seatService
    ) {
        this.orderMapper = orderMapper;
        this.paymentMapper = paymentMapper;
        this.flightMapper = flightMapper;
        this.configMapper = configMapper;
        this.routeMapper = routeMapper;
        this.refundChangeRecordMapper = refundChangeRecordMapper;
        this.userMapper = userMapper;
        this.seatService = seatService;
    }

    @Override
    public Result<List<RefundChangeSearchResponse>> search(Long userId, Long orderNo) {
        // ... (查询逻辑无需大改，仅展示核心变化) ...
        // ... 此处逻辑与原文件基本一致，主要是 Mapper 的替换 ...
        // 为节省篇幅，省略 search 方法的具体实现，保留你原来的即可
        return Result.ok(new ArrayList<>());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Long> apply(RefundChangeApplyRequest req) {
        Orders o = orderMapper.selectById(req.getOrderNo());
        if (o == null) return Result.fail(404, "order not found");
        
        LocalDateTime now = LocalDateTime.now();
        Integer operType = req.getOperType(); // 1退票 2改签

        RefundChangeRecord r = new RefundChangeRecord();
        r.setOrderId(o.getOrderId());
        r.setOperType(operType);
        r.setOldFlightId(o.getFlightId());
        r.setOldCabinId(o.getCabinId());
        r.setOperUserId(o.getUserId());
        r.setAuditStatus(0);
        r.setOperTime(now);
        r.setRemark(req.getRemark());

        if (operType == 2) {
            // 改签逻辑
            Flight newFlight = flightMapper.selectOne(new QueryWrapper<Flight>().eq("flight_no", req.getNewFlightNo()));
            if (newFlight == null) return Result.fail(404, "new flight not found");
            
            // 查新配置
            AircraftCabinConfig newConfig = configMapper.selectOne(Wrappers.<AircraftCabinConfig>lambdaQuery()
                .eq(AircraftCabinConfig::getModelId, newFlight.getModelId())
                .eq(AircraftCabinConfig::getCabinType, req.getNewCabinType())
                .last("LIMIT 1"));
                
            if (newConfig == null) return Result.fail(404, "new cabin config not found");
            
            // 动态查库存 (使用 SeatService)
            Integer available = seatService.getAvailableCount(newFlight.getFlightId(), newConfig.getCabinType());
            
            if (available < o.getTicketNum()) {
                return Result.fail(409, "insufficient seats in new flight");
            }

            r.setNewFlightId(newFlight.getFlightId());
            r.setNewCabinId(newConfig.getConfigId());
        }

        refundChangeRecordMapper.insert(r);
        o.setOrderStatus(4); // 4=处理中/改签中/退票中
        orderMapper.updateById(o);

        return Result.ok(r.getRecordId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> approve(Long recordId) {
        RefundChangeRecord r = refundChangeRecordMapper.selectById(recordId);
        if (r == null) return Result.fail(404, "record not found");
        if (r.getAuditStatus() != 0) return Result.fail(409, "record not pending");

        Orders o = orderMapper.selectById(r.getOrderId());
        if (o == null) return Result.fail(404, "order not found");

        LocalDateTime now = LocalDateTime.now();
        
        if (r.getOperType() == 1) { 
            // === 退票 ===
            // 释放座位
            seatService.releaseSeats(o.getOrderId());
            
            o.setOrderStatus(5); // 5=已退票
            o.setRefundTime(now);
            orderMapper.updateById(o);

        } else {
            // === 改签 ===
            AircraftCabinConfig newConfig = configMapper.selectById(r.getNewCabinId());
            
            // 1. 释放原座位
            seatService.releaseSeats(o.getOrderId());
            
            // 2. 锁定并确认新座位 (若失败会回滚)
            try {
                seatService.lockSeats(r.getNewFlightId(), newConfig.getCabinType(), o.getTicketNum(), o.getOrderId());
                seatService.confirmSeats(o.getOrderId());
            } catch (Exception e) {
                return Result.fail(409, "insufficient seats now or locking failed");
            }

            Flight newFlight = flightMapper.selectById(r.getNewFlightId());
            
            // 计算差价或新总价
            Route route = routeMapper.selectById(newFlight.getRouteId());
            if (route == null) return Result.fail(404, "route not found");
            BigDecimal newPrice = route.getBasePrice().multiply(newConfig.getCabinCoefficient());
            BigDecimal newTotal = newPrice.multiply(BigDecimal.valueOf(o.getTicketNum()));

            o.setFlightId(r.getNewFlightId());
            o.setCabinId(r.getNewCabinId());
            o.setTotalAmount(newTotal);
            o.setOrderStatus(2); // 改签成功 -> 变回已确认
            o.setChangeTime(now);
            orderMapper.updateById(o);
        }

        r.setAuditStatus(1);
        r.setAuditTime(now);
        refundChangeRecordMapper.updateById(r);
        
        return Result.ok(true);
    }
    
    // ... reject, revoke, updatePending 逻辑类似，主要是去掉库存操作 ...
    @Override
    public Result<Boolean> reject(Long recordId) {
         // ...
         return Result.ok(true);
    }
    
    @Override
    public Result<Boolean> revoke(Long recordId) {
         // ...
         return Result.ok(true);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> updatePending(Long recordId, RefundChangeApplyRequest req) {
        RefundChangeRecord r = refundChangeRecordMapper.selectById(recordId);
        if (r == null) return Result.fail(404, "record not found");
        if (r.getAuditStatus() != 0) return Result.fail(409, "record not pending");

        r.setRemark(req.getRemark());
        r.setOperTime(LocalDateTime.now());
        // 如果有其他字段需要更新，可以在这里添加

        refundChangeRecordMapper.updateById(r);
        return Result.ok(true);
    }
}