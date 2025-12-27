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
import com.team.skylink.module.order.service.PriceStrategyService;
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
    private final PriceStrategyService priceStrategyService;

    public RefundChangeServiceImpl(
            OrderMapper orderMapper,
            PaymentMapper paymentMapper,
            FlightMapper flightMapper,
            AircraftCabinConfigMapper configMapper,
            RouteMapper routeMapper,
            RefundChangeRecordMapper refundChangeRecordMapper,
            UserMapper userMapper,
            SeatService seatService,
            PriceStrategyService priceStrategyService
    ) {
        this.orderMapper = orderMapper;
        this.paymentMapper = paymentMapper;
        this.flightMapper = flightMapper;
        this.configMapper = configMapper;
        this.routeMapper = routeMapper;
        this.refundChangeRecordMapper = refundChangeRecordMapper;
        this.userMapper = userMapper;
        this.seatService = seatService;
        this.priceStrategyService = priceStrategyService;
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
        
        // 1. Determine Target Orders (Bundled)
        List<Orders> targetOrders = new ArrayList<>();
        if (o.getParentOrderId() != null) {
            targetOrders = orderMapper.selectList(Wrappers.<Orders>lambdaQuery()
                    .eq(Orders::getParentOrderId, o.getParentOrderId()));
        } else {
            targetOrders.add(o);
        }
        
        LocalDateTime now = LocalDateTime.now();
        Integer operType = req.getOperType(); // 1=Refund, 2=Change
        Long mainRecordId = null;
        
        // Change logic preprocessing
        List<Flight> newFlights = new ArrayList<>();
        List<AircraftCabinConfig> newConfigs = new ArrayList<>();
        if (operType == 2) {
            // Reject legacy field to avoid ambiguous mapping
            if (req.getNewFlightNo() != null && !req.getNewFlightNo().isBlank()) {
                return Result.fail(400, "改签请使用 newFlightId/newFlightIds（flightNo 不再允许用于写入）");
            }

            // Build newFlightIds (support single and interline)
            List<Long> newFlightIds = req.getNewFlightIds();
            if (newFlightIds == null || newFlightIds.isEmpty()) {
                newFlightIds = new ArrayList<>();
                if (req.getNewFlightId() != null) {
                    newFlightIds.add(req.getNewFlightId());
                }
            }

            if (newFlightIds == null || newFlightIds.isEmpty()) {
                return Result.fail(400, "改签必须提供 newFlightId/newFlightIds");
            }

            // Validation
            if (newFlightIds.size() != targetOrders.size()) {
                return Result.fail(400, "改签必须完全匹配原订单航段数量 (Interline change requires matching segments)");
            }

            // Build newCabinTypes (support single and interline)
            List<String> newCabinTypes = req.getNewCabinTypes();
            if (newCabinTypes == null || newCabinTypes.isEmpty()) {
                if (req.getNewCabinType() != null) {
                    newCabinTypes = new ArrayList<>();
                    for (int i = 0; i < newFlightIds.size(); i++) {
                        newCabinTypes.add(req.getNewCabinType());
                    }
                } else {
                    return Result.fail(400, "改签必须提供 newCabinType 或 newCabinTypes");
                }
            }

            if (newCabinTypes.size() != newFlightIds.size()) {
                return Result.fail(400, "newCabinTypes 长度必须与 newFlightIds 一致");
            }

            // Look up flights and configs
            for (int i = 0; i < newFlightIds.size(); i++) {
                Long fId = newFlightIds.get(i);
                String cabinType = newCabinTypes.get(i);
                Flight nf = fId != null ? flightMapper.selectById(fId) : null;
                if (nf == null) return Result.fail(404, "New flight not found: " + fId);

                AircraftCabinConfig nc = configMapper.selectOne(Wrappers.<AircraftCabinConfig>lambdaQuery()
                        .eq(AircraftCabinConfig::getModelId, nf.getModelId())
                        .eq(AircraftCabinConfig::getCabinType, cabinType)
                        .last("LIMIT 1"));
                if (nc == null) return Result.fail(404, "New cabin config not found for flightId: " + fId + ", cabinType: " + cabinType);

                // Check inventory
                Integer avail = seatService.getAvailableCount(nf.getFlightId(), nc.getCabinType());
                if (avail < targetOrders.get(i).getTicketNum()) {
                    return Result.fail(409, "Insufficient seats in new flightId: " + fId + ", cabinType: " + cabinType);
                }
                newFlights.add(nf);
                newConfigs.add(nc);
            }
        }

        // 2. Create Records for ALL targets
        for (int i=0; i<targetOrders.size(); i++) {
            Orders order = targetOrders.get(i);
            
            // Fee Calculation
            BigDecimal feeRate = (operType == 2) ? new BigDecimal("0.10") : new BigDecimal("0.20");
            BigDecimal fee = order.getTotalAmount().multiply(feeRate);
            String feeRemark = String.format(" | 手续费(Fee): %s", fee.setScale(2, java.math.RoundingMode.HALF_UP));

            RefundChangeRecord r = new RefundChangeRecord();
            r.setOrderId(order.getOrderId());
            r.setOperType(operType);
            r.setOldFlightId(order.getFlightId());
            r.setOldCabinId(order.getCabinId());
            r.setOperUserId(order.getUserId());
            r.setOperUserType(1);
            r.setAuditStatus(0);
            r.setOperTime(now);
            r.setRemark((req.getRemark() != null ? req.getRemark() : "") + feeRemark);
            
            if (operType == 2) {
                 r.setNewFlightId(newFlights.get(i).getFlightId());
                 r.setNewCabinId(newConfigs.get(i).getConfigId());
            }
            
            refundChangeRecordMapper.insert(r);
            if (order.getOrderId().equals(o.getOrderId())) {
                mainRecordId = r.getRecordId();
            }
            
            // Update Order Status to 4 (Processing) - 避免 updateById
            LambdaUpdateWrapper<Orders> processingUpdate = Wrappers.<Orders>lambdaUpdate()
                    .eq(Orders::getOrderId, order.getOrderId())
                    .set(Orders::getOrderStatus, 4);
            orderMapper.update(null, processingUpdate);
        }
        
        return Result.ok(mainRecordId != null ? mainRecordId : -1L);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> approve(Long recordId) {
        RefundChangeRecord r = refundChangeRecordMapper.selectById(recordId);
        if (r == null) return Result.fail(404, "record not found");
        if (r.getAuditStatus() != 0) return Result.fail(409, "record not pending");

        Orders o = orderMapper.selectById(r.getOrderId());
        if (o == null) return Result.fail(404, "order not found");
        
        // Find ALL sibling records if bundled
        List<RefundChangeRecord> allRecords = new ArrayList<>();
        if (o.getParentOrderId() != null) {
            // Find sibling orders
            List<Orders> siblings = orderMapper.selectList(Wrappers.<Orders>lambdaQuery()
                    .eq(Orders::getParentOrderId, o.getParentOrderId()));
            List<Long> orderIds = new ArrayList<>();
            for(Orders s : siblings) orderIds.add(s.getOrderId());
            
            // Find pending records for these orders
            allRecords = refundChangeRecordMapper.selectList(Wrappers.<RefundChangeRecord>lambdaQuery()
                    .in(RefundChangeRecord::getOrderId, orderIds)
                    .eq(RefundChangeRecord::getAuditStatus, 0));
        } else {
            allRecords.add(r);
        }
        
        LocalDateTime now = LocalDateTime.now();
        
        for (RefundChangeRecord rec : allRecords) {
             Orders order = orderMapper.selectById(rec.getOrderId());
             
             // Approve logic
             // rec.setAuditStatus(1); // Approved
             // refundChangeRecordMapper.updateById(rec);
             // Use LambdaUpdateWrapper to avoid updating sharding key
             LambdaUpdateWrapper<RefundChangeRecord> approveUpdate = Wrappers.<RefundChangeRecord>lambdaUpdate()
                     .eq(RefundChangeRecord::getRecordId, rec.getRecordId())
                     .set(RefundChangeRecord::getAuditStatus, 1);
             refundChangeRecordMapper.update(null, approveUpdate);
             
             if (rec.getOperType() == 1) { // Refund
                 seatService.releaseSeats(order.getOrderId());
                 order.setOrderStatus(5); // Refunded
                 order.setRefundTime(now);
             } else { // Change
                 Flight oldFlight = flightMapper.selectById(order.getFlightId());
                 Flight newFlight = flightMapper.selectById(rec.getNewFlightId());
                 AircraftCabinConfig oldConfig = configMapper.selectById(order.getCabinId());
                 AircraftCabinConfig newConfig = configMapper.selectById(rec.getNewCabinId());
                 Route oldRoute = oldFlight != null ? routeMapper.selectById(oldFlight.getRouteId()) : null;
                 Route newRoute = newFlight != null ? routeMapper.selectById(newFlight.getRouteId()) : null;

                 if (oldFlight == null || newFlight == null || oldConfig == null || newConfig == null || oldRoute == null || newRoute == null) {
                     throw new RuntimeException("Change failed for order " + order.getOrderId() + ": Missing flight/config/route data");
                 }

                 boolean isInterline = order.getParentOrderId() != null;
                 BigDecimal newSegmentPrice = priceStrategyService.calculateSegmentPrice(newFlight, newRoute, newConfig, isInterline, order.getUserId());
                 BigDecimal newTotalAmount = newSegmentPrice.multiply(new BigDecimal(order.getTicketNum()));

                 // 1. Release old
                 seatService.releaseSeats(order.getOrderId());

                 // 2. Lock new
                 try {
                     Long newSeatId = seatService.lockRandomSeat(rec.getNewFlightId(), rec.getNewCabinId(), order.getUserId());
                     seatService.associateOrder(order.getUserId(), java.util.Collections.singletonList(newSeatId), order.getOrderId());
                     LambdaUpdateWrapper<Orders> changeUpdate = Wrappers.<Orders>lambdaUpdate()
                             .eq(Orders::getOrderId, order.getOrderId())
                             .set(Orders::getFlightId, rec.getNewFlightId())
                             .set(Orders::getCabinId, rec.getNewCabinId())
                             .set(Orders::getSeatId, newSeatId)
                             .set(Orders::getTotalAmount, newTotalAmount)
                             .set(Orders::getOrderStatus, 1)
                             .set(Orders::getChangeTime, now);
                     orderMapper.update(null, changeUpdate);
                 } catch (Exception e) {
                     throw new RuntimeException("Change failed for order " + order.getOrderId() + ": " + e.getMessage());
                 }
             }
             if (rec.getOperType() == 1) {
                 LambdaUpdateWrapper<Orders> refundUpdate = Wrappers.<Orders>lambdaUpdate()
                         .eq(Orders::getOrderId, order.getOrderId())
                         .set(Orders::getOrderStatus, 5)
                         .set(Orders::getRefundTime, now);
                 orderMapper.update(null, refundUpdate);
             }
        }
        
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
