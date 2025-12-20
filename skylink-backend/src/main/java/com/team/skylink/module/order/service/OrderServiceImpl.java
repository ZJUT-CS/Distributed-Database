package com.team.skylink.module.order.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.module.auth.entity.User;
import com.team.skylink.module.auth.mapper.UserMapper;
import com.team.skylink.module.flight.entity.Cabin;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.mapper.CabinMapper;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.order.dto.CreateOrderRequest;
import com.team.skylink.module.order.dto.OrderSearchResponse;
import com.team.skylink.module.order.entity.Order;
import com.team.skylink.module.order.mapper.OrderMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {
    private final OrderMapper orderMapper;
    private final FlightMapper flightMapper;
    private final UserMapper userMapper;
    private final CabinMapper cabinMapper;

    public OrderServiceImpl(OrderMapper orderMapper, FlightMapper flightMapper, UserMapper userMapper, CabinMapper cabinMapper) {
        this.orderMapper = orderMapper;
        this.flightMapper = flightMapper;
        this.userMapper = userMapper;
        this.cabinMapper = cabinMapper;
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

        LambdaUpdateWrapper<Cabin> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Cabin::getCabinId, c.getCabinId())
                .setSql("remaining_seats = remaining_seats - " + req.getTicketNum());

        int updateResult = cabinMapper.update(null, updateWrapper);
        if (updateResult <= 0) {
            return Result.fail(409, "seat update failed, maybe insufficient seats");
        }

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
        o.setPassengerName(req.getPassengerName());
        o.setContactEmail(req.getContactEmail());
        o.setContactPhone(req.getContactPhone());
        o.setPassengersJson(req.getPassengersJson());
        o.setOrderTime(LocalDateTime.now());
        orderMapper.insert(o);

        User u = userMapper.selectById(o.getUserId());
        OrderSearchResponse r = new OrderSearchResponse();
        r.setOrderNo(String.valueOf(o.getOrderId()));
        r.setFlightNo(f.getFlightNo());
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
        r.setOrigin(f.getDeparturePlace());
        r.setDestination(f.getDestination());
        r.setDepartureTime(f.getDepartureTime());
        r.setArrivalTime(f.getArrivalTime());

        return Result.ok(r);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> cancel(Long orderId) {
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

        Cabin cabin = cabinMapper.selectById(o.getCabinId());
        if (cabin != null && o.getTicketNum() != null) {
            LambdaUpdateWrapper<Cabin> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(Cabin::getCabinId, cabin.getCabinId())
                    .setSql("remaining_seats = remaining_seats + " + o.getTicketNum());
            cabinMapper.update(null, updateWrapper);
        }

        LambdaUpdateWrapper<Order> orderUpdate = new LambdaUpdateWrapper<>();
        orderUpdate.eq(Order::getOrderId, o.getOrderId())
                .set(Order::getOrderStatus, 2);
        int rows = orderMapper.update(null, orderUpdate);

        return Result.ok(rows > 0);
    }
}

