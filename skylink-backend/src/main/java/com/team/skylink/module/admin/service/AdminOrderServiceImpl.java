package com.team.skylink.module.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.controller.AdminOrderController;
import com.team.skylink.module.admin.service.AdminOrderService;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper; // 替换
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.user.entity.User;
import com.team.skylink.module.user.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class AdminOrderServiceImpl implements AdminOrderService {
    
    private final OrderMapper orderMapper;
    private final FlightMapper flightMapper;
    private final UserMapper userMapper;
    private final AircraftCabinConfigMapper configMapper; // 替换

    public AdminOrderServiceImpl(OrderMapper orderMapper, FlightMapper flightMapper, 
                                 UserMapper userMapper, AircraftCabinConfigMapper configMapper) {
        this.orderMapper = orderMapper;
        this.flightMapper = flightMapper;
        this.userMapper = userMapper;
        this.configMapper = configMapper;
    }

    @Override
    public Result<PageResult<AdminOrderController.AdminOrderItem>> list(
            Integer page, Integer size, Long orderNo, Long userId, Integer orderStatus, String flightNo) {
        int p = page != null && page > 0 ? page : 1;
        int s = size != null && size > 0 ? Math.min(size, 100) : 10;
        int offset = (p - 1) * s;

        QueryWrapper<Orders> qw = new QueryWrapper<>();
        if (orderNo != null) qw.eq("order_id", orderNo);
        if (userId != null) qw.eq("user_id", userId);
        if (orderStatus != null) qw.eq("order_status", orderStatus);
        
        if (flightNo != null && !flightNo.isBlank()) {
            Flight f = flightMapper.selectOne(new QueryWrapper<Flight>().eq("flight_no", flightNo.trim()));
            if (f == null) return Result.ok(new PageResult<>(0, new ArrayList<>()));
            qw.eq("flight_id", f.getFlightId());
        }
        
        qw.orderByDesc("order_time");
        Long total = orderMapper.selectCount(qw);
        qw.last("limit " + offset + "," + s);
        List<Orders> orders = orderMapper.selectList(qw);

        List<AdminOrderController.AdminOrderItem> items = new ArrayList<>();
        for (Orders o : orders) {
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
            if (f != null) {
                it.setFlightNo(f.getFlightNo());
                it.setOrigin(f.getDeparturePlace());
                it.setDestination(f.getDestination());
                it.setDepartureTime(f.getDepartureTime());
                it.setArrivalTime(f.getArrivalTime());
            }
            it.setCabinId(o.getCabinId());
            it.setFlightId(o.getFlightId());
            items.add(it);
        }
        return Result.ok(new PageResult<>(total != null ? total : 0, items));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> auditOrder(Long orderId, Boolean pass) {
        Orders currentOrder = orderMapper.selectById(orderId);
        if (currentOrder == null) return Result.fail(404, "订单不存在");
        if (currentOrder.getOrderStatus() == null || currentOrder.getOrderStatus() != 0) {
            return Result.fail(400, "该订单状态无需审核");
        }

        int targetStatus = Boolean.TRUE.equals(pass) ? 1 : 3;

        if (currentOrder.getParentOrderId() != null) {
            UpdateWrapper<Orders> updateWrapper = new UpdateWrapper<>();
            updateWrapper.eq("parent_order_id", currentOrder.getParentOrderId())
                         .set("order_status", targetStatus);
            orderMapper.update(null, updateWrapper);
        } else {
            currentOrder.setOrderStatus(targetStatus);
            orderMapper.updateById(currentOrder);
        }
        return Result.ok(true);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> updateStatus(Long orderId, Integer orderStatus) {
        if (orderId == null) return Result.fail(400, "orderId is required");
        Orders o = orderMapper.selectById(orderId);
        if (o == null) return Result.fail(404, "order not found");
        
        // 动态库存逻辑：状态变为 3(拒绝), 5(退款), 6(取消) 时，库存自动释放
        o.setOrderStatus(orderStatus);
        return Result.ok(orderMapper.updateById(o) > 0);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> cancel(Long orderId) {
        Orders o = orderMapper.selectById(orderId);
        if (o == null) return Result.fail(404, "order not found");
        
        // 只有待审核(0)或待支付(1)可以取消
        if (o.getOrderStatus() != 0 && o.getOrderStatus() != 1) {
             return Result.fail(409, "当前状态不可取消");
        }

        o.setOrderStatus(6); // 设置为已取消
        return Result.ok(orderMapper.updateById(o) > 0);
    }

    @Override
    public Result<Boolean> delete(Long orderId) {
        Orders o = orderMapper.selectById(orderId);
        if (o == null) return Result.fail(404, "order not found");
        Integer s = o.getOrderStatus();
        if (s == 0 || s == 1 || s == 2) return Result.fail(409, "活跃订单不可删除");
        
        return Result.ok(orderMapper.deleteById(orderId) > 0);
    }
}