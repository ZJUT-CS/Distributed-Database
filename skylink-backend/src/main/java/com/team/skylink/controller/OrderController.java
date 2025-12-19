package com.team.skylink.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper; // 必须导入这个
import com.team.skylink.common.Result;
import com.team.skylink.dto.OrderSearchResponse;
import com.team.skylink.dto.CreateOrderRequest;
import com.team.skylink.entity.Cabin;
import com.team.skylink.entity.Flight;
import com.team.skylink.entity.Order;
import com.team.skylink.entity.User;
import com.team.skylink.mapper.CabinMapper;
import com.team.skylink.mapper.FlightMapper;
import com.team.skylink.mapper.OrderMapper;
import com.team.skylink.mapper.UserMapper;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping({"/orders", "/api/v1/orders"})
public class OrderController {
    private final OrderMapper orderMapper;
    private final FlightMapper flightMapper;
    private final UserMapper userMapper;
    private final CabinMapper cabinMapper;

    public OrderController(OrderMapper orderMapper, FlightMapper flightMapper, UserMapper userMapper, CabinMapper cabinMapper) {
        this.orderMapper = orderMapper;
        this.flightMapper = flightMapper;
        this.userMapper = userMapper;
        this.cabinMapper = cabinMapper;
    }

    @GetMapping("/search")
    public Result<List<OrderSearchResponse>> search(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long orderNo,
            @RequestParam(required = false) Integer orderStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime createTimeStart,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime createTimeEnd,
            @RequestParam(required = false) String flightNo,
            @RequestParam(required = false) String cabinType
    ) {
        QueryWrapper<Order> qw = new QueryWrapper<>();
        if (userId != null) {
            qw.eq("user_id", userId);
        }
        if (orderNo != null) {
            qw.eq("order_id", orderNo);
        }
        if (orderStatus != null) {
            qw.eq("order_status", orderStatus);
        }
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
        if (cabinType != null && !cabinType.isEmpty()) {
            List<Cabin> cabins = cabinMapper.selectList(new QueryWrapper<Cabin>().eq("cabin_type", cabinType));
            if (cabins.isEmpty()) {
                return Result.ok(new ArrayList<>());
            }
            List<Long> cabinIds = cabins.stream().map(Cabin::getCabinId).toList();
            qw.in("cabin_id", cabinIds);
        }

        List<Order> orders = orderMapper.selectList(qw);
        List<OrderSearchResponse> resp = new ArrayList<>();
        for (Order o : orders) {
            Flight f = flightMapper.selectById(o.getFlightId());
            User u = userMapper.selectById(o.getUserId());
            OrderSearchResponse r = new OrderSearchResponse();
            r.setOrderNo(String.valueOf(o.getOrderId()));
            r.setFlightNo(f != null ? f.getFlightNo() : null);
            r.setPassengerName(u != null ? u.getRealName() : null);
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

    @PostMapping("/create")
    @Transactional(rollbackFor = Exception.class)
    public Result<OrderSearchResponse> create(@Valid @RequestBody CreateOrderRequest req) {
        try {
            Flight f = flightMapper.selectOne(new QueryWrapper<Flight>().eq("flight_no", req.getFlightNo()));
            if (f == null) {
                return Result.fail(404, "flight not found");
            }
            Cabin c = cabinMapper.selectOne(new QueryWrapper<Cabin>().eq("flight_id", f.getFlightId()).eq("cabin_type", req.getCabinType()));
            if (c == null) {
                return Result.fail(404, "cabin not found");
            }
            if (c.getRemainingSeats() < req.getTicketNum()) {
                return Result.fail(409, "insufficient seats");
            }

            // ================= 修改开始：使用 LambdaUpdateWrapper 扣减库存 =================
            LambdaUpdateWrapper<Cabin> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(Cabin::getCabinId, c.getCabinId())
                         // 直接在数据库层面做减法：remaining_seats = remaining_seats - num
                         // 这样生成的 SQL 只有 UPDATE cabins SET remaining_seats=... WHERE ...
                         // 不会包含 flight_id，从而通过 ShardingSphere 检查
                         .setSql("remaining_seats = remaining_seats - " + req.getTicketNum());
            
            // 注意：这里第一个参数传 null，只用 updateWrapper
            int updateResult = cabinMapper.update(null, updateWrapper);
            if (updateResult <= 0) {
                 // 考虑到并发情况，可能在查出来有票到更新时没票了，这里最好做个双重检查
                 return Result.fail(409, "seat update failed, maybe insufficient seats");
            }
            // ================= 修改结束 =================

            Order o = new Order();
            o.setUserId(req.getUserId());
            o.setFlightId(f.getFlightId());
            o.setCabinId(c.getCabinId());
            o.setOrderStatus(0);
            o.setTicketNum(req.getTicketNum());
            if (c.getPrice() != null) {
                o.setTotalAmount(c.getPrice().multiply(java.math.BigDecimal.valueOf(req.getTicketNum())));
            } else {
                 o.setTotalAmount(java.math.BigDecimal.ZERO);
            }
            o.setOrderTime(LocalDateTime.now());
            orderMapper.insert(o);
            
            User u = userMapper.selectById(o.getUserId());
            OrderSearchResponse r = new OrderSearchResponse();
            r.setOrderNo(String.valueOf(o.getOrderId()));
            r.setFlightNo(f.getFlightNo());
            r.setPassengerName(u != null ? u.getRealName() : null);
            r.setOrderStatus(o.getOrderStatus());
            r.setTotalAmount(o.getTotalAmount());
            r.setOrderTime(o.getOrderTime());
            r.setPayTime(o.getPayTime());
            r.setRefundTime(o.getRefundTime());
            r.setChangeTime(o.getChangeTime());
            r.setOrigin(f.getDeparturePlace());
            r.setDestination(f.getDestination());
            r.setDepartureTime(f.getDepartureTime());
            r.setArrivalTime(f.getArrivalTime());
            
            return Result.ok(r);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.fail(500, "Internal Error: " + e.getMessage());
        }
    }

    @PostMapping("/{orderId}/cancel")
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> cancel(@PathVariable("orderId") Long orderId) {
        if (orderId == null) {
            return Result.fail(400, "orderId is required");
        }
        Order o = orderMapper.selectById(orderId);
        if (o == null) {
            return Result.fail(404, "order not found");
        }
        if (o.getOrderStatus() == null || o.getOrderStatus() != 0) {
            return Result.fail(409, "order is not cancellable");
        }

        // ================= 修改开始：取消订单归还库存 =================
        Cabin cabin = cabinMapper.selectById(o.getCabinId());
        if (cabin != null && o.getTicketNum() != null) {
            LambdaUpdateWrapper<Cabin> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(Cabin::getCabinId, cabin.getCabinId())
                         .setSql("remaining_seats = remaining_seats + " + o.getTicketNum());
            cabinMapper.update(null, updateWrapper);
        }
        // ================= 修改结束 =================

        o.setOrderStatus(2);
        // 如果 Order 表也被分片了，这里用 updateById 也有风险
        // 但通常 Order ID 是分片键，updateById 只要不改 ID 就行
        // 为了保险，这里只更新 status 也是更好的做法
        LambdaUpdateWrapper<Order> orderUpdate = new LambdaUpdateWrapper<>();
        orderUpdate.eq(Order::getOrderId, o.getOrderId())
                   .set(Order::getOrderStatus, 2);
        int rows = orderMapper.update(null, orderUpdate);
        
        return Result.ok(rows > 0);
    }
}