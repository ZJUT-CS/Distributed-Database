package com.team.skylink.module.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.controller.AdminOrderController;
import com.team.skylink.module.auth.entity.User;
import com.team.skylink.module.auth.mapper.UserMapper;
import com.team.skylink.module.flight.entity.Cabin;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.mapper.CabinMapper;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.order.entity.Order;
import com.team.skylink.module.order.mapper.OrderMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class AdminOrderServiceImpl implements AdminOrderService {
    private final OrderMapper orderMapper;
    private final FlightMapper flightMapper;
    private final UserMapper userMapper;
    private final CabinMapper cabinMapper;

    public AdminOrderServiceImpl(OrderMapper orderMapper, FlightMapper flightMapper, UserMapper userMapper, CabinMapper cabinMapper) {
        this.orderMapper = orderMapper;
        this.flightMapper = flightMapper;
        this.userMapper = userMapper;
        this.cabinMapper = cabinMapper;
    }

    @Override
    public Result<PageResult<AdminOrderController.AdminOrderItem>> list(
            Integer page,
            Integer size,
            Long orderNo,
            Long userId,
            Integer orderStatus,
            String flightNo
    ) {
        int p = page != null && page > 0 ? page : 1;
        int s = size != null && size > 0 ? Math.min(size, 100) : 10;
        int offset = (p - 1) * s;

        QueryWrapper<Order> qw = new QueryWrapper<>();
        if (orderNo != null) {
            qw.eq("order_id", orderNo);
        }
        if (userId != null) {
            qw.eq("user_id", userId);
        }
        if (orderStatus != null) {
            qw.eq("order_status", orderStatus);
        }
        if (flightNo != null && !flightNo.isBlank()) {
            Flight f = flightMapper.selectOne(new QueryWrapper<Flight>().eq("flight_no", flightNo.trim()));
            if (f == null) {
                return Result.ok(new PageResult<>(0, new ArrayList<>()));
            }
            qw.eq("flight_id", f.getFlightId());
        }
        qw.orderByDesc("order_time");

        Long total = orderMapper.selectCount(qw);
        qw.last("limit " + offset + "," + s);
        List<Order> orders = orderMapper.selectList(qw);

        List<AdminOrderController.AdminOrderItem> items = new ArrayList<>();
        for (Order o : orders) {
            AdminOrderController.AdminOrderItem it = new AdminOrderController.AdminOrderItem();
            it.setOrderNo(o.getOrderId());
            it.setUserId(o.getUserId());
            it.setOrderStatus(o.getOrderStatus());
            it.setTicketNum(o.getTicketNum());
            it.setTotalAmount(o.getTotalAmount());
            it.setOrderTime(o.getOrderTime());
            it.setPayTime(o.getPayTime());
            it.setRefundTime(o.getRefundTime());
            it.setChangeTime(o.getChangeTime());

            User u = o.getUserId() != null ? userMapper.selectById(o.getUserId()) : null;
            it.setPassengerName(u != null ? u.getRealName() : null);
            it.setEmail(u != null ? u.getEmail() : null);
            it.setPhoneNumber(u != null ? u.getPhoneNumber() : null);

            Flight f = o.getFlightId() != null ? flightMapper.selectById(o.getFlightId()) : null;
            it.setFlightNo(f != null ? f.getFlightNo() : null);
            it.setOrigin(f != null ? f.getDeparturePlace() : null);
            it.setDestination(f != null ? f.getDestination() : null);
            it.setDepartureTime(f != null ? f.getDepartureTime() : null);
            it.setArrivalTime(f != null ? f.getArrivalTime() : null);

            it.setCabinId(o.getCabinId());
            it.setFlightId(o.getFlightId());
            items.add(it);
        }

        return Result.ok(new PageResult<>(total != null ? total : 0, items));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> updateStatus(Long orderId, Integer orderStatus) {
        if (orderId == null) return Result.fail(400, "orderId is required");
        Order o = orderMapper.selectById(orderId);
        if (o == null) return Result.fail(404, "order not found");

        Integer from = o.getOrderStatus();
        Integer to = orderStatus;
        if (to == null) return Result.fail(400, "orderStatus is required");

        if ((from == null || from != 2) && to == 2) {
            Cabin cabin = cabinMapper.selectById(o.getCabinId());
            if (cabin != null && o.getTicketNum() != null) {
                cabin.setRemainingSeats(cabin.getRemainingSeats() + o.getTicketNum());
                cabinMapper.updateById(cabin);
            }
        }

        o.setOrderStatus(to);
        int rows = orderMapper.updateById(o);
        return Result.ok(rows > 0);
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
            cabin.setRemainingSeats(cabin.getRemainingSeats() + o.getTicketNum());
            cabinMapper.updateById(cabin);
        }
        o.setOrderStatus(2);
        int rows = orderMapper.updateById(o);
        return Result.ok(rows > 0);
    }

    @Override
    public Result<Boolean> delete(Long orderId) {
        if (orderId == null) return Result.fail(400, "orderId is required");
        Order o = orderMapper.selectById(orderId);
        if (o == null) return Result.fail(404, "order not found");
        if (o.getOrderStatus() != null && o.getOrderStatus() == 0) {
            return Result.fail(409, "pending order cannot be deleted");
        }
        int rows = orderMapper.deleteById(orderId);
        return Result.ok(rows > 0);
    }
}

