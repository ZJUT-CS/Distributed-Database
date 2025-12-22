package com.team.skylink.module.order.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.team.skylink.common.Result;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper;
import com.team.skylink.module.user.mapper.UserMapper;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.flight.mapper.RouteMapper;
import com.team.skylink.module.order.dto.CreateOrderRequest;
import com.team.skylink.module.order.dto.OrderSearchResponse;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.user.entity.User;

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
    // 【替换】
    private final AircraftCabinConfigMapper configMapper;
    private final RouteMapper routeMapper;

    public OrderServiceImpl(OrderMapper orderMapper, FlightMapper flightMapper, UserMapper userMapper, AircraftCabinConfigMapper configMapper, RouteMapper routeMapper) {
        this.orderMapper = orderMapper;
        this.flightMapper = flightMapper;
        this.userMapper = userMapper;
        this.configMapper = configMapper;
        this.routeMapper = routeMapper;
    }

    @Override
    public Result<List<OrderSearchResponse>> search(
            Long userId,
            Long orderNo,
            Integer orderStatus,
            LocalDateTime createTimeStart,
            LocalDateTime createTimeEnd,
            String flightNo,
            String cabinType
    ) {
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
            Flight f = flightMapper.selectOne(new QueryWrapper<Flight>().eq("flight_no", flightNo));
            if (f != null) {
                qw.eq("flight_id", f.getFlightId());
            } else {
                return Result.ok(new ArrayList<>());
            }
        }
        
        // 这里的 cabinType 筛选比较麻烦，需要关联 Config 表，这里简化跳过，或者通过 ID 列表查询
        if (cabinType != null && !cabinType.isEmpty()) {
             // 暂不支持直接按 cabinType 筛选历史订单，或者你需要手动联表
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
        // 1. 查航班
        Flight f = flightMapper.selectOne(new QueryWrapper<Flight>().eq("flight_no", req.getFlightNo()));
        if (f == null) {
            return Result.fail(404, "flight not found");
        }

        // 2. 查配置 (找对应舱位类型的配置)
        // 注意：这里假设一个航班只有一种 Layout，所以直接拿 modelId 查。如果支持多 Layout，需要 Flight 表里存 layout_no
        // 暂定 Flight 表没有存 layoutNo，我们默认取 layout 1
        AircraftCabinConfig config = configMapper.selectOne(Wrappers.<AircraftCabinConfig>lambdaQuery()
                .eq(AircraftCabinConfig::getModelId, f.getModelId())
                .eq(AircraftCabinConfig::getCabinType, req.getCabinType())
                .eq(AircraftCabinConfig::getCabinLayoutNo, 1) // 默认布局1
                .last("LIMIT 1")); 

        if (config == null) {
            return Result.fail(404, "cabin config not found");
        }

        // 3. 动态查库存 (Capacity - 已卖出)
        Long soldCount = orderMapper.selectCount(Wrappers.<Orders>lambdaQuery()
                .eq(Orders::getFlightId, f.getFlightId())
                .eq(Orders::getCabinId, config.getConfigId())
                .in(Orders::getOrderStatus, 1, 2)); // 1待支付 2已确认 算占用

        long remaining = config.getCapacity() - soldCount;
        if (remaining < req.getTicketNum()) {
            return Result.fail(409, "insufficient seats");
        }

        // 4. 计算总价
        Route route = routeMapper.selectById(f.getRouteId());
        if (route == null) return Result.fail(404, "route not found");
        BigDecimal unitPrice = route.getBasePrice().multiply(config.getCabinCoefficient());
        BigDecimal totalAmount = unitPrice.multiply(BigDecimal.valueOf(req.getTicketNum()));

        // 5. 生成订单
        Orders o = new Orders();
        o.setUserId(req.getUserId());
        o.setFlightId(f.getFlightId());
        o.setCabinId(config.getConfigId()); // 这里的 CabinId 存的是 ConfigId
        o.setOrderStatus(0); // 待审核
        o.setTicketNum(req.getTicketNum());
        o.setTotalAmount(totalAmount);
        o.setPassengerName(req.getPassengerName());
        o.setContactEmail(req.getContactEmail());
        o.setContactPhone(req.getContactPhone());
        o.setPassengersJson(req.getPassengersJson());
        o.setOrderTime(LocalDateTime.now());
        
        orderMapper.insert(o);

        // 6. 返回结果
        User u = userMapper.selectById(o.getUserId());
        OrderSearchResponse r = new OrderSearchResponse();
        r.setOrderNo(String.valueOf(o.getOrderId()));
        r.setFlightNo(f.getFlightNo());
        r.setPassengerName(o.getPassengerName());
        r.setOrderStatus(o.getOrderStatus());
        r.setTotalAmount(o.getTotalAmount());
        r.setOrderTime(o.getOrderTime());
        
        return Result.ok(r);
    }

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

        // 不需要归还库存操作，直接改状态即可，动态计算时会自动释放
        o.setOrderStatus(6); // 6=已取消
        orderMapper.updateById(o);

        return Result.ok(true);
    }
}