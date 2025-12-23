package com.team.skylink.module.order.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.team.skylink.common.Result;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper;
import com.team.skylink.module.user.entity.User;
import com.team.skylink.module.user.mapper.UserMapper;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.flight.mapper.RouteMapper;
import com.team.skylink.module.order.dto.CreateOrderRequest;
import com.team.skylink.module.order.dto.OrderSearchResponse;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.flight.service.SeatService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
    public Result<List<OrderSearchResponse>> search(Long userId, Long orderNo, Integer orderStatus, LocalDateTime createTimeStart, LocalDateTime createTimeEnd, String flightNo, String cabinType) {
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
                return Result.ok(new ArrayList<>());
            }
        }
        
        List<Orders> orders = orderMapper.selectList(qw);
        List<OrderSearchResponse> resp = new ArrayList<>();
        for (Orders o : orders) {
            Flight f = flightMapper.selectById(o.getFlightId());
            User u = userMapper.selectById(o.getUserId());
            OrderSearchResponse r = new OrderSearchResponse();
            r.setOrderNo(String.valueOf(o.getOrderId()));
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

        for (int i = 0; i < flightNos.size(); i++) {
            String fNo = flightNos.get(i);
            // 1. 查航班
            // flight_no 可能重复；用 LIMIT 1 避免 TooManyResultsException
            Flight f = flightMapper.selectOne(new QueryWrapper<Flight>()
                    .eq("flight_no", fNo)
                    .orderByDesc("flight_id")
                    .last("LIMIT 1"));
            if (f == null) {
                return Result.fail(404, "flight not found: " + fNo);
            }
            if (i == 0) firstFlight = f;

            // 2. 查配置
            AircraftCabinConfig config = configMapper.selectOne(Wrappers.<AircraftCabinConfig>lambdaQuery()
                    .eq(AircraftCabinConfig::getModelId, f.getModelId())
                    .eq(AircraftCabinConfig::getCabinType, req.getCabinType())
                    .eq(AircraftCabinConfig::getCabinLayoutNo, 1) // 默认布局1
                    .last("LIMIT 1")); 

            if (config == null) {
                return Result.fail(404, "cabin config not found for flight: " + fNo);
            }

            // 3. 动态查库存 (Capacity - 已卖出)
            Long soldCount = orderMapper.selectCount(Wrappers.<Orders>lambdaQuery()
                    .eq(Orders::getFlightId, f.getFlightId())
                    .eq(Orders::getCabinId, config.getConfigId())
                    .in(Orders::getOrderStatus, 1, 2, 4)); 

            long remaining = config.getCapacity() - soldCount;
            if (remaining < req.getTicketNum()) {
                return Result.fail(409, "insufficient seats for flight: " + fNo);
            }

            // 4. 计算总价
            Route route = routeMapper.selectById(f.getRouteId());
            if (route == null) return Result.fail(404, "route not found for flight: " + fNo);
            BigDecimal unitPrice = route.getBasePrice().multiply(config.getCabinCoefficient());
            BigDecimal totalAmount = unitPrice.multiply(BigDecimal.valueOf(req.getTicketNum()));
            totalAmountAll = totalAmountAll.add(totalAmount);

            // 5. 准备订单
            Orders o = new Orders();
            o.setUserId(req.getUserId());
            o.setFlightId(f.getFlightId());
            o.setCabinId(config.getConfigId());
            o.setOrderStatus(0); // 初始状态：待审核
            o.setTicketNum(req.getTicketNum());
            o.setTotalAmount(totalAmount);
            o.setPassengerName(req.getPassengerName());
            o.setContactEmail(req.getContactEmail());
            o.setContactPhone(req.getContactPhone());
            o.setPassengersJson(req.getPassengersJson());
            o.setOrderTime(LocalDateTime.now());
            
            o.setParentOrderId(parentOrderId);
            o.setTripType(i + 1);
            
            ordersToInsert.add(o);
        }
        
        for (Orders o : ordersToInsert) {
            orderMapper.insert(o);
        }

        // 6. 返回结果
        OrderSearchResponse r = new OrderSearchResponse();
        r.setOrderNo(String.valueOf(parentOrderId));
        r.setFlightNo(firstFlight.getFlightNo());
        r.setPassengerName(ordersToInsert.get(0).getPassengerName());
        r.setOrderStatus(0);
        r.setTotalAmount(totalAmountAll);
        r.setOrderTime(ordersToInsert.get(0).getOrderTime());
        
        return Result.ok(r);
    }

    // --- 【修复1】Cancel 方法：补全逻辑并修复语法错误 ---
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> cancel(Long orderId) {
        if (orderId == null) return Result.fail(400, "orderId is required");
        
        Orders o = orderMapper.selectById(orderId);
        if (o == null) return Result.fail(404, "order not found");
        
        // 允许取消的状态：0待审核, 1待支付
        if (o.getOrderStatus() != 0 && o.getOrderStatus() != 1) {
            return Result.fail(409, "order cannot be cancelled in current status");
        }

        // 级联取消逻辑：如果是联程票，需要把同一 parentOrderId 下的所有票都取消
        if (o.getParentOrderId() != null) {
            LambdaUpdateWrapper<Orders> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(Orders::getParentOrderId, o.getParentOrderId())
                         .set(Orders::getOrderStatus, 6); // 6=已取消
            orderMapper.update(null, updateWrapper);
        } else {
            // 普通独立票
            o.setOrderStatus(6); 
            orderMapper.updateById(o);
        }

        return Result.ok(true);
    }

    // --- 【修复2】Audit 方法：补全缺失的方法 ---
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> audit(Long orderId, boolean pass) {
        Orders order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }

        // 只有 0 (待审核) 状态可以审核
        if (order.getOrderStatus() != 0) { 
            throw new RuntimeException("订单状态非待审核，操作失败");
        }

        int newStatus = pass ? 1 : 3;

        // 级联审核逻辑：如果是联程票，审核其中一段，另一段同步变更
        if (order.getParentOrderId() != null) {
            LambdaUpdateWrapper<Orders> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(Orders::getParentOrderId, order.getParentOrderId())
                         .set(Orders::getOrderStatus, newStatus);
            orderMapper.update(null, updateWrapper);
        } else {
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
}
