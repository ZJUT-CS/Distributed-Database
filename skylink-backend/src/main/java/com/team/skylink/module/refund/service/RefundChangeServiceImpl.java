package com.team.skylink.module.refund.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
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
import java.time.format.DateTimeFormatter;
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
        var q = Wrappers.<RefundChangeRecord>lambdaQuery();
        if (userId != null) {
            q.eq(RefundChangeRecord::getOperUserId, userId);
        }
        if (orderNo != null) {
            q.eq(RefundChangeRecord::getOrderId, orderNo);
        }
        q.orderByDesc(RefundChangeRecord::getOperTime);

        List<RefundChangeRecord> records = refundChangeRecordMapper.selectList(q);
        if (records == null || records.isEmpty()) {
            return Result.ok(new ArrayList<>());
        }

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        List<RefundChangeSearchResponse> out = new ArrayList<>(records.size());
        for (RefundChangeRecord r : records) {
            RefundChangeSearchResponse resp = new RefundChangeSearchResponse();
            resp.setId(String.valueOf(r.getRecordId()));
            resp.setOrderId(String.valueOf(r.getOrderId()));

            // passenger
            String passenger = null;
            if (r.getOperUserId() != null) {
                var u = userMapper.selectById(r.getOperUserId());
                if (u != null) {
                    passenger = u.getRealName();
                    if (passenger == null || passenger.trim().isEmpty()) {
                        passenger = u.getPhoneNumber();
                    }
                }
            }
            if (passenger == null || passenger.trim().isEmpty()) {
                passenger = "-";
            }
            resp.setPassenger(passenger);

            // type
            String type = (r.getOperType() != null && r.getOperType() == 2) ? "改签" : "退票";
            resp.setType(type);

            // flights
            resp.setOldFlight(formatFlight(r.getOldFlightId()));
            resp.setNewFlight(r.getNewFlightId() == null ? "-" : formatFlight(r.getNewFlightId()));

            // time
            resp.setApplyTime(r.getOperTime() == null ? null : r.getOperTime().format(fmt));

            // status
            resp.setStatus(toAuditStatus(r.getAuditStatus()));
            resp.setRemark(r.getRemark());

            out.add(resp);
        }

        return Result.ok(out);
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
        r.setOperUserType( 1);
        r.setAuditStatus(0);
        r.setOperTime(now);
        r.setRemark(req.getRemark());

        if (operType == 2) {
            // 改签逻辑
            Flight newFlight = flightMapper.selectOne(new QueryWrapper<Flight>()
                    .eq("flight_no", req.getNewFlightNo())
                    .orderByDesc("flight_id")
                    .last("LIMIT 1"));
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
        
        LambdaUpdateWrapper<Orders> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Orders::getOrderId, o.getOrderId())
                .set(Orders::getOrderStatus, 4); // 4=处理中/改签中/退票中
        orderMapper.update(null, updateWrapper);

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
            
            LambdaUpdateWrapper<Orders> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(Orders::getOrderId, o.getOrderId())
                    .set(Orders::getOrderStatus, 5) // 5=已退票
                    .set(Orders::getRefundTime, now);
            orderMapper.update(null, updateWrapper);

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

            LambdaUpdateWrapper<Orders> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(Orders::getOrderId, o.getOrderId())
                    .set(Orders::getFlightId, r.getNewFlightId())
                    .set(Orders::getCabinId, r.getNewCabinId())
                    .set(Orders::getTotalAmount, newTotal)
                    .set(Orders::getOrderStatus, 2) // 改签成功 -> 变回已确认
                    .set(Orders::getChangeTime, now);
            orderMapper.update(null, updateWrapper);
        }

        LambdaUpdateWrapper<RefundChangeRecord> recordUpdateWrapper = new LambdaUpdateWrapper<>();
        recordUpdateWrapper.eq(RefundChangeRecord::getRecordId, r.getRecordId())
                .set(RefundChangeRecord::getAuditStatus, 1)
                .set(RefundChangeRecord::getAuditTime, now);
        refundChangeRecordMapper.update(null, recordUpdateWrapper);
        
        return Result.ok(true);
    }
    
    // ... reject, revoke, updatePending 逻辑类似，主要是去掉库存操作 ...
    @Override
    public Result<Boolean> reject(Long recordId) {
           RefundChangeRecord r = refundChangeRecordMapper.selectById(recordId);
           if (r == null) return Result.fail(404, "record not found");
           if (r.getAuditStatus() != 0) return Result.fail(409, "record not pending");

           Orders o = orderMapper.selectById(r.getOrderId());
           if (o == null) return Result.fail(404, "order not found");

           LocalDateTime now = LocalDateTime.now();
           
           LambdaUpdateWrapper<RefundChangeRecord> recordUpdateWrapper = new LambdaUpdateWrapper<>();
           recordUpdateWrapper.eq(RefundChangeRecord::getRecordId, r.getRecordId())
                   .set(RefundChangeRecord::getAuditStatus, 2)
                   .set(RefundChangeRecord::getAuditTime, now);
           refundChangeRecordMapper.update(null, recordUpdateWrapper);

           // 退改签被拒绝：订单回到已确认(2)
           LambdaUpdateWrapper<Orders> updateWrapper = new LambdaUpdateWrapper<>();
           updateWrapper.eq(Orders::getOrderId, o.getOrderId())
                   .set(Orders::getOrderStatus, 2);
           orderMapper.update(null, updateWrapper);

           return Result.ok(true);
    }
    
    @Override
    public Result<Boolean> revoke(Long recordId) {
           RefundChangeRecord r = refundChangeRecordMapper.selectById(recordId);
           if (r == null) return Result.fail(404, "record not found");
           if (r.getAuditStatus() != 0) return Result.fail(409, "record not pending");

           Orders o = orderMapper.selectById(r.getOrderId());
           if (o == null) return Result.fail(404, "order not found");

           // 撤销申请：删除记录，订单回到已确认(2)
           refundChangeRecordMapper.deleteById(recordId);
           
           LambdaUpdateWrapper<Orders> updateWrapper = new LambdaUpdateWrapper<>();
           updateWrapper.eq(Orders::getOrderId, o.getOrderId())
                   .set(Orders::getOrderStatus, 2);
           orderMapper.update(null, updateWrapper);

           return Result.ok(true);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> updatePending(Long recordId, RefundChangeApplyRequest req) {
        RefundChangeRecord r = refundChangeRecordMapper.selectById(recordId);
        if (r == null) return Result.fail(404, "record not found");
        if (r.getAuditStatus() != 0) return Result.fail(409, "record not pending");

        LambdaUpdateWrapper<RefundChangeRecord> recordUpdateWrapper = new LambdaUpdateWrapper<>();
        recordUpdateWrapper.eq(RefundChangeRecord::getRecordId, r.getRecordId())
                .set(RefundChangeRecord::getRemark, req.getRemark())
                .set(RefundChangeRecord::getOperTime, LocalDateTime.now());
        refundChangeRecordMapper.update(null, recordUpdateWrapper);

        return Result.ok(true);
    }

    private String toAuditStatus(Integer auditStatus) {
        if (auditStatus == null) return "pending";
        return switch (auditStatus) {
            case 0 -> "pending";
            case 1 -> "approved";
            case 2 -> "rejected";
            default -> "pending";
        };
    }

    private String formatFlight(Long flightId) {
        if (flightId == null) return "-";
        Flight f = flightMapper.selectById(flightId);
        if (f == null) return "-";
        String dep = f.getDepartureCity() == null ? "" : f.getDepartureCity();
        String arr = f.getArrivalCity() == null ? "" : f.getArrivalCity();
        String route = (!dep.isEmpty() || !arr.isEmpty()) ? (dep + " → " + arr) : "";
        if (!route.isEmpty()) {
            return (f.getFlightNo() + " " + route).trim();
        }
        return f.getFlightNo();
    }
}
