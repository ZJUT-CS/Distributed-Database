package com.team.skylink.module.order.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.core.JsonProcessingException; // 导入异常类
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.skylink.common.Result;
import com.team.skylink.common.PageResult;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper;
import com.team.skylink.module.user.entity.User;
import com.team.skylink.module.user.mapper.UserMapper;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.flight.entity.Seat;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.flight.mapper.RouteMapper;
import com.team.skylink.module.order.dto.CreateOrderRequest;
import com.team.skylink.module.order.dto.OrderSearchResponse;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.flight.service.SeatService;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class OrderServiceImpl implements OrderService {
    private final OrderMapper orderMapper;
    private final FlightMapper flightMapper;
    private final UserMapper userMapper;
    private final AircraftCabinConfigMapper configMapper;
    private final RouteMapper routeMapper;
    private final SeatService seatService;

    public OrderServiceImpl(OrderMapper orderMapper, FlightMapper flightMapper, UserMapper userMapper, AircraftCabinConfigMapper configMapper, RouteMapper routeMapper, SeatService seatService) {
        this.orderMapper = orderMapper;
        this.flightMapper = flightMapper;
        this.userMapper = userMapper;
        this.configMapper = configMapper;
        this.routeMapper = routeMapper;
        this.seatService = seatService;
    }

    @Override
    public Result<PageResult<OrderSearchResponse>> search(Long userId, Long orderNo, Integer orderStatus, LocalDateTime createTimeStart, LocalDateTime createTimeEnd, String flightNo, String cabinType, int page, int size) {
        QueryWrapper<Orders> qw = new QueryWrapper<>();
        if (userId != null) qw.eq("user_id", userId);
        if (orderNo != null) qw.eq("order_id", orderNo);
        if (orderStatus != null) qw.eq("order_status", orderStatus);
        
        if (createTimeStart != null && createTimeEnd != null) {
            qw.between("order_time", createTimeStart, createTimeEnd);
        } else if (createTimeStart != null) {
            qw.ge("order_time", createTimeStart);
        } else if (createTimeEnd != null) {
            qw.le("order_time", createTimeEnd);
        }
        
        if (flightNo != null && !flightNo.isEmpty()) {
            // flight_no 可能在脏数据/测试数据下出现重复，selectOne 会抛 TooManyResultsException
            Flight f = flightMapper.selectOne(new QueryWrapper<Flight>()
                    .eq("flight_no", flightNo)
                    .orderByDesc("flight_id")
                    .last("LIMIT 1"));
            if (f != null) {
                qw.eq("flight_id", f.getFlightId());
            } else {
                return Result.ok(new PageResult<>(0, new ArrayList<>()));
            }
        }
        
        Long total = orderMapper.selectCount(qw);
        
        qw.orderByDesc("order_time");
        int offset = (page - 1) * size;
        qw.last("limit " + offset + "," + size);
        
        List<Orders> orders = orderMapper.selectList(qw);
        List<OrderSearchResponse> resp = new ArrayList<>();
        for (Orders o : orders) {
            Flight f = flightMapper.selectById(o.getFlightId());
            User u = userMapper.selectById(o.getUserId());
            OrderSearchResponse r = new OrderSearchResponse();
            r.setOrderNo(String.valueOf(o.getOrderId()));
            r.setFlightId(o.getFlightId());
            r.setSeatId(o.getSeatId());
            r.setFlightNo(f != null ? f.getFlightNo() : null);
            r.setPassengerName(o.getPassengerName() != null && !o.getPassengerName().isBlank() ? o.getPassengerName() : (u != null ? u.getRealName() : null));
            r.setContactEmail(o.getContactEmail());
            r.setContactPhone(o.getContactPhone());
            r.setPassengersJson(o.getPassengersJson());
            r.setOrderStatus(o.getOrderStatus());
            r.setTotalAmount(o.getTotalAmount());
            r.setOrderTime(o.getOrderTime());
            r.setPayTime(o.getPayTime());
            r.setRefundTime(o.getRefundTime());
            r.setChangeTime(o.getChangeTime());
            
            if (f != null) {
                r.setOrigin(f.getDeparturePlace());
                r.setDestination(f.getDestination());
                r.setDepartureTime(f.getDepartureTime());
                r.setArrivalTime(f.getArrivalTime());
            }
            resp.add(r);
        }
        return Result.ok(new PageResult<>(total, resp));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<OrderSearchResponse> create(CreateOrderRequest req) {
        List<String> flightNos = req.getFlightNos();
        if (flightNos == null || flightNos.isEmpty()) {
            flightNos = new ArrayList<>();
            if (req.getFlightNo() != null) {
                flightNos.add(req.getFlightNo());
            }
        }
        
        if (flightNos.isEmpty()) {
            return Result.fail(400, "flightNo is required");
        }

        Long parentOrderId = com.baomidou.mybatisplus.core.toolkit.IdWorker.getId();
        BigDecimal totalAmountAll = BigDecimal.ZERO;
        List<Orders> ordersToInsert = new ArrayList<>();
        Flight firstFlight = null;
        ObjectMapper objectMapper = new ObjectMapper();
        java.util.List<java.util.Map<String, Object>> passengers = null;
        try {
            if (req.getPassengersJson() != null && !req.getPassengersJson().isBlank()) {
                passengers = objectMapper.readValue(req.getPassengersJson(), new TypeReference<java.util.List<java.util.Map<String, Object>>>() {});
            }
        } catch (Exception e) {
            passengers = null;
        }

        for (int i = 0; i < flightNos.size(); i++) {
            String fNo = flightNos.get(i);
            // 1. 查航班
            // flight_no 可能重复；用 LIMIT 1 避免 TooManyResultsException
            Flight f = flightMapper.selectOne(new QueryWrapper<Flight>()
                    .eq("flight_no", fNo)
                    .orderByDesc("flight_id")
                    .last("LIMIT 1"));
            if (f == null) {
                return Result.fail(404, "找不到航班: " + fNo);
            }
            if (i == 0) firstFlight = f;

            // 2. 查配置
            AircraftCabinConfig config = configMapper.selectOne(Wrappers.<AircraftCabinConfig>lambdaQuery()
                    .eq(AircraftCabinConfig::getModelId, f.getModelId())
                    .eq(AircraftCabinConfig::getCabinType, req.getCabinType())
                    .eq(AircraftCabinConfig::getCabinLayoutNo, 1) // 默认布局1
                    .last("LIMIT 1")); 

            if (config == null) {
                return Result.fail(404, "找不到舱位配置: " + fNo);
            }

            int ticketCount = req.getTicketNum() != null ? req.getTicketNum() : (passengers != null ? passengers.size() : 1);

            // 4. 计算总价
            Route route = routeMapper.selectById(f.getRouteId());
            if (route == null) return Result.fail(404, "找不到航线信息: " + fNo);
            BigDecimal unitPrice = route.getBasePrice().multiply(config.getCabinCoefficient());
            
            for (int pIdx = 0; pIdx < ticketCount; pIdx++) {
                Long oid = com.baomidou.mybatisplus.core.toolkit.IdWorker.getId();
                Long seatId;
                try {
                    // 修复：传入 userId 而不是 orderId
                    seatId = seatService.lockRandomSeat(f.getFlightId(), config.getConfigId(), req.getUserId());
                } catch (Exception e) {
                    if (e.getMessage() != null && e.getMessage().contains("InventoryShortage")) {
                        throw new RuntimeException("抱歉，该航班座位已售罄");
                    }
                    if (e.getMessage() != null && e.getMessage().contains("no available seat")) {
                         throw new RuntimeException("抱歉，该航班座位已售罄");
                    }
                    throw new RuntimeException("您选择的座位刚刚被抢走了，请重新选择");
                }
                
                BigDecimal totalAmount = unitPrice.multiply(BigDecimal.ONE);
                totalAmountAll = totalAmountAll.add(totalAmount);

                Orders o = new Orders();
                o.setOrderId(oid);
                o.setUserId(req.getUserId());
                o.setFlightId(f.getFlightId());
                o.setCabinId(config.getConfigId());
                o.setOrderStatus(1); // 1=Pending Payment (无需审核)
                o.setTicketNum(1);
                o.setTotalAmount(totalAmount);
                
                String singleName = req.getPassengerName();
                String singlePhone = req.getContactPhone();
                String singleEmail = req.getContactEmail();
                String singlePassengerJson = req.getPassengersJson();
                
                if (passengers != null && pIdx < passengers.size()) {
                    java.util.Map<String, Object> pi = passengers.get(pIdx);
                    // --- 【修复重点】增加 try-catch 处理 JsonProcessingException ---
                    try {
                        singlePassengerJson = objectMapper.writeValueAsString(java.util.Collections.singletonList(pi));
                    } catch (JsonProcessingException e) {
                        throw new RuntimeException("乘客信息格式错误，请检查", e);
                    }
                    
                    Object n = pi.get("name");
                    Object ph = pi.get("phone");
                    if (n != null) singleName = String.valueOf(n);
                    if (ph != null) singlePhone = String.valueOf(ph);
                }
                o.setPassengerName(singleName);
                o.setContactEmail(singleEmail);
                o.setContactPhone(singlePhone);
                o.setPassengersJson(singlePassengerJson);
                o.setOrderTime(LocalDateTime.now());
                o.setSeatId(seatId);
                o.setParentOrderId(parentOrderId);
                o.setTripType(i + 1);
                ordersToInsert.add(o);
            }
        }
        
        for (Orders o : ordersToInsert) {
            orderMapper.insert(o);
        }

        // 6. 返回结果
        OrderSearchResponse r = new OrderSearchResponse();
        r.setOrderNo(String.valueOf(parentOrderId));
        r.setFlightNo(firstFlight.getFlightNo());
        r.setPassengerName(ordersToInsert.get(0).getPassengerName());
        r.setOrderStatus(1); // Pending Payment
        r.setTotalAmount(totalAmountAll);
        r.setOrderTime(ordersToInsert.get(0).getOrderTime());
        
        return Result.ok(r);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> cancel(Long orderId) {
        if (orderId == null) return Result.fail(400, "orderId is required");
        
        Orders o = orderMapper.selectById(orderId);
        if (o == null) return Result.fail(404, "订单不存在");
        
        if (o.getOrderStatus() != 0 && o.getOrderStatus() != 1) {
            return Result.fail(409, "订单状态不正确，无法取消");
        }

        // 释放座位 (Mode B)
        try {
            if (o.getSeatId() != null) {
                seatService.releaseSeat(o.getSeatId());
            } else {
                seatService.releaseSeats(o.getOrderId());
            }
        } catch (Exception e) {
            log.warn("释放座位失败: " + e.getMessage());
            // 不阻断取消流程
        }

        // 级联取消逻辑
        if (o.getParentOrderId() != null) {
            LambdaUpdateWrapper<Orders> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(Orders::getParentOrderId, o.getParentOrderId())
                         .set(Orders::getOrderStatus, 6); // 6=已取消
            orderMapper.update(null, updateWrapper);
        } else {
            o.setOrderStatus(6); 
            orderMapper.updateById(o);
        }

        return Result.ok(true);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> audit(Long orderId, boolean pass) {
        Orders order = orderMapper.selectById(orderId);
        if (order == null) {
            return Result.fail(404, "订单不存在");
        }

        // 移除针对状态0(待审核)的逻辑，仅处理售后申请(如状态4)
        if (order.getOrderStatus() != 4) { 
            return Result.fail(400, "当前订单状态不需要审核");
        }

        LocalDateTime now = LocalDateTime.now();
        // 4=退票申请中 -> 5=已退款(Pass) OR 2=已确认/拒绝退票(Reject)
        int newStatus = pass ? 5 : 2; 

        if (order.getParentOrderId() != null) {
            if (pass) {
                // 如果是退票通过，需要释放座位
                List<Orders> siblings = orderMapper.selectList(Wrappers.<Orders>lambdaQuery()
                        .eq(Orders::getParentOrderId, order.getParentOrderId()));
                for (Orders sib : siblings) {
                    releaseSeatsForOrder(sib);
                }
            }
            LambdaUpdateWrapper<Orders> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(Orders::getParentOrderId, order.getParentOrderId())
                         .set(Orders::getOrderStatus, newStatus);
            if (pass) {
                updateWrapper.set(Orders::getRefundTime, now);
            }
            orderMapper.update(null, updateWrapper);
        } else {
            if (pass) {
                releaseSeatsForOrder(order);
                order.setRefundTime(now);
            }
            order.setOrderStatus(newStatus);
            orderMapper.updateById(order);
        }
        
        return Result.ok(true);
    }

    @Override
    public Result<List<OrderSearchResponse>> listMyOrders(Long userId) {
        QueryWrapper<Orders> qw = new QueryWrapper<>();
        qw.eq("user_id", userId)
          .ne("order_status", 0)
          .orderByDesc("order_time");
        List<Orders> orders = orderMapper.selectList(qw);
        List<OrderSearchResponse> resp = new ArrayList<>();
        for (Orders o : orders) {
            Flight f = flightMapper.selectById(o.getFlightId());
            User u = userMapper.selectById(o.getUserId());
            OrderSearchResponse r = new OrderSearchResponse();
            r.setOrderNo(String.valueOf(o.getOrderId()));
            r.setFlightId(o.getFlightId());
            r.setSeatId(o.getSeatId());
            r.setFlightNo(f != null ? f.getFlightNo() : null);
            r.setPassengerName(o.getPassengerName() != null && !o.getPassengerName().isBlank() ? o.getPassengerName() : (u != null ? u.getRealName() : null));
            r.setContactEmail(o.getContactEmail());
            r.setContactPhone(o.getContactPhone());
            r.setPassengersJson(o.getPassengersJson());
            r.setOrderStatus(o.getOrderStatus());
            r.setTotalAmount(o.getTotalAmount());
            r.setOrderTime(o.getOrderTime());
            r.setPayTime(o.getPayTime());
            r.setRefundTime(o.getRefundTime());
            r.setChangeTime(o.getChangeTime());
            if (f != null) {
                r.setOrigin(f.getDeparturePlace());
                r.setDestination(f.getDestination());
                r.setDepartureTime(f.getDepartureTime());
                r.setArrivalTime(f.getArrivalTime());
            }
            resp.add(r);
        }
        return Result.ok(resp);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<OrderSearchResponse> selectSeat(Long orderId, Long seatId) {
        // 1. 基础参数校验
        if (orderId == null || seatId == null) {
            return Result.fail(400, "参数无效：订单ID或座位ID不能为空");
        }

        // 2. 获取订单信息
        Orders o = orderMapper.selectById(orderId);
        if (o == null) {
            return Result.fail(404, "订单不存在");
        }
        
        // 3. 获取座位信息进行预检查
        Seat seat = seatService.getById(seatId);
        if (seat == null) {
            return Result.fail(404, "座位不存在");
        }

        // 4. 执行座位状态检查 (独立方法)
        Result<Void> checkResult = checkSeatStatus(seat, o);
        if (checkResult.getCode() != 0) {
            log.warn("选座预检查失败: orderId={}, seatId={}, userId={}, reason={}, seatStatus={}", 
                     orderId, seatId, o.getUserId(), checkResult.getMsg(), seat.getStatus());
            return Result.fail(checkResult.getCode(), checkResult.getMsg());
        }

        // 5. 详细日志记录 (改进点1)
        log.info("尝试选座: orderId={}, seatId={}, userId={}, currentSeatStatus={}, requestTime={}",
                 orderId, seatId, o.getUserId(), seat.getStatus(), LocalDateTime.now());

        // 6. 执行选座 (含重试逻辑 - 改进点3)
        boolean ok = false;
        int maxRetries = 3;
        String failReason = "系统繁忙，请稍后重试";

        for (int i = 0; i < maxRetries; i++) {
            try {
                // 缓存检查 (模拟，此处可接入Redis缓存检查)
                // checkSeatCache(seatId); 
                
                // 尝试更新 (乐观锁机制)
                ok = seatService.changeSeat(orderId, seatId);
                if (ok) {
                    break;
                }
                
                // 如果失败，检查是否是因为刚刚被占用
                Seat currentSeat = seatService.getById(seatId);
                if (currentSeat != null && currentSeat.getStatus() != 1) {
                    failReason = "很抱歉，该座位刚刚已被其他用户锁定";
                    log.warn("选座并发冲突: seatId={} status={}", seatId, currentSeat.getStatus());
                    break; // 状态已变，无需重试
                }
                
                // 短暂休眠后重试
                Thread.sleep(50 * (i + 1));
            } catch (Exception e) {
                log.error("选座异常重试 {}/{}: {}", i + 1, maxRetries, e.getMessage());
            }
        }

        if (!ok) {
            log.warn("座位选择最终失败: orderId={} seatId={} reason={}", orderId, seatId, failReason);
            return Result.fail(409, failReason);
        }

        log.info("座位选择成功 orderId={} seatId={}", orderId, seatId);
        
        // 7. 构建返回结果
        Orders updated = orderMapper.selectById(orderId);
        // 双重检查：确保更新后的订单确实关联了该座位
        if (updated.getSeatId() == null || !updated.getSeatId().equals(seatId)) {
             log.error("数据不一致：选座返回成功但订单未更新 seatId. orderId={}", orderId);
             // 可能是事务隔离级别问题，但在此处作为防御性编程
        }
        
        Flight f = flightMapper.selectById(updated.getFlightId());
        User u = userMapper.selectById(updated.getUserId());
        OrderSearchResponse r = new OrderSearchResponse();
        r.setOrderNo(String.valueOf(updated.getOrderId()));
        r.setFlightId(updated.getFlightId());
        r.setSeatId(updated.getSeatId());
        r.setFlightNo(f != null ? f.getFlightNo() : null);
        r.setPassengerName(updated.getPassengerName() != null && !updated.getPassengerName().isBlank() ? updated.getPassengerName() : (u != null ? u.getRealName() : null));
        r.setContactEmail(updated.getContactEmail());
        r.setContactPhone(updated.getContactPhone());
        r.setPassengersJson(updated.getPassengersJson());
        r.setOrderStatus(updated.getOrderStatus());
        r.setTotalAmount(updated.getTotalAmount());
        r.setOrderTime(updated.getOrderTime());
        r.setPayTime(updated.getPayTime());
        r.setRefundTime(updated.getRefundTime());
        r.setChangeTime(updated.getChangeTime());
        if (f != null) {
            r.setOrigin(f.getDeparturePlace());
            r.setDestination(f.getDestination());
            r.setDepartureTime(f.getDepartureTime());
            r.setArrivalTime(f.getArrivalTime());
        }
        return Result.ok(r);
    }

    /**
     * 检查座位状态 (改进点4: 独立方法)
     */
    private Result<Void> checkSeatStatus(Seat seat, Orders order) {
        if (!seat.getFlightId().equals(order.getFlightId())) {
            return Result.fail(400, "座位所属航班与订单不匹配");
        }
        
        // 状态判断 (改进点2: 增强错误处理)
        switch (seat.getStatus()) {
            case 1: // AVAILABLE
                return Result.ok(null);
            case 2: // OCCUPIED
                return Result.fail(409, "该座位已售出");
            case 3: // LOCKED
                // 检查是否是当前用户锁定的（如果是换座场景，可能允许）
                // 但根据 changeSeat 逻辑，它只允许 status=1 -> 3
                return Result.fail(409, "该座位已被锁定，请稍后再试");
            default:
                return Result.fail(409, "座位处于不可选状态 (Code: " + seat.getStatus() + ")");
        }
    }

    private void releaseSeatsForOrder(Orders o) {
        if (o == null) return;
        if (o.getSeatId() != null) {
            seatService.releaseSeat(o.getSeatId());
        } else if (o.getOrderId() != null) {
            seatService.releaseSeats(o.getOrderId());
        }
    }
}
