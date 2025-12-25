package com.team.skylink.module.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.common.enums.OrderStatusEnum;
import com.team.skylink.module.admin.controller.AdminOrderController;
import com.team.skylink.module.admin.service.AdminOrderService;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper; // 替换
import com.team.skylink.module.flight.service.SeatService;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.order.service.OrderService;
import com.team.skylink.module.user.entity.User;
import com.team.skylink.module.user.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdminOrderServiceImpl implements AdminOrderService {
    
    private final OrderMapper orderMapper;
    private final FlightMapper flightMapper;
    private final UserMapper userMapper;
    private final AircraftCabinConfigMapper configMapper; // 替换
    private final OrderService orderService;
    private final SeatService seatService;

    public AdminOrderServiceImpl(OrderMapper orderMapper, FlightMapper flightMapper, 
                                 UserMapper userMapper, AircraftCabinConfigMapper configMapper,
                                 OrderService orderService,
                                 SeatService seatService) {
        this.orderMapper = orderMapper;
        this.flightMapper = flightMapper;
        this.userMapper = userMapper;
        this.configMapper = configMapper;
        this.orderService = orderService;
        this.seatService = seatService;
    }

    @Override
    public Result<PageResult<AdminOrderController.AdminOrderItem>> list(
            Integer page, Integer size, Long orderNo, Long userId, Integer orderStatus, Long flightId, String flightNo) {
        int p = page != null && page > 0 ? page : 1;
        int s = size != null && size > 0 ? Math.min(size, 100) : 10;
        int offset = (p - 1) * s;

        QueryWrapper<Orders> countQw = new QueryWrapper<>();
        if (orderNo != null) countQw.eq("order_id", orderNo);
        if (userId != null) countQw.eq("user_id", userId);
        if (orderStatus != null) countQw.eq("order_status", orderStatus);

        Long resolvedFlightId = flightId;
        if (resolvedFlightId == null && flightNo != null && !flightNo.isBlank()) {
            String normalizedFlightNo = flightNo.trim();
            if (normalizedFlightNo.isEmpty()) {
                return Result.fail(400, "flightNo is invalid");
            }

            List<Flight> flights = flightMapper.selectList(new QueryWrapper<Flight>()
                    .select("flight_id")
                    .eq("flight_no", normalizedFlightNo)
                    .orderByDesc("flight_id")
                    .last("LIMIT 2"));
            if (flights.isEmpty()) {
                return Result.ok(new PageResult<>(0, new ArrayList<>()));
            }
            if (flights.size() > 1) {
                return Result.fail(400, "flightNo is not unique, please use flightId");
            }
            resolvedFlightId = flights.get(0).getFlightId();
        }
        if (resolvedFlightId != null) {
            countQw.eq("flight_id", resolvedFlightId);
        }

        Long total = orderMapper.selectCount(countQw);

        QueryWrapper<Orders> listQw = new QueryWrapper<>();
        if (orderNo != null) listQw.eq("order_id", orderNo);
        if (userId != null) listQw.eq("user_id", userId);
        if (orderStatus != null) listQw.eq("order_status", orderStatus);
        if (resolvedFlightId != null) listQw.eq("flight_id", resolvedFlightId);

        listQw.orderByDesc("order_time");
        listQw.last("limit " + offset + "," + s);
        List<Orders> orders = orderMapper.selectList(listQw);

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
        return orderService.audit(orderId, Boolean.TRUE.equals(pass));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> updateStatus(Long orderId, Integer orderStatus) {
        if (orderId == null) return Result.fail(400, "orderId is required");
        Orders o = orderMapper.selectById(orderId);
        if (o == null) return Result.fail(404, "订单不存在");
        
        Integer target = orderStatus;

        if (o.getParentOrderId() != null) {
            if (target != null && (target == OrderStatusEnum.REJECTED.getCode()
                    || target == OrderStatusEnum.REFUNDED.getCode()
                    || target == OrderStatusEnum.CANCELLED.getCode())) {
                List<Orders> siblings = orderMapper.selectList(Wrappers.<Orders>lambdaQuery()
                        .eq(Orders::getParentOrderId, o.getParentOrderId()));
                for (Orders sib : siblings) {
                    releaseSeatsForOrder(sib);
                }
            }

            var update = Wrappers.<Orders>lambdaUpdate().eq(Orders::getParentOrderId, o.getParentOrderId())
                    .set(Orders::getOrderStatus, target);
            if (target != null && target == OrderStatusEnum.PENDING_PAYMENT.getCode()) {
                update.set(Orders::getAuditTime, LocalDateTime.now());
            }
            return Result.ok(orderMapper.update(null, update) > 0);
        }

        if (target != null && (target == OrderStatusEnum.REJECTED.getCode()
                || target == OrderStatusEnum.REFUNDED.getCode()
                || target == OrderStatusEnum.CANCELLED.getCode())) {
            releaseSeatsForOrder(o);
        }

        o.setOrderStatus(target);
        if (target != null && target == OrderStatusEnum.PENDING_PAYMENT.getCode() && o.getAuditTime() == null) {
            o.setAuditTime(LocalDateTime.now());
        }
        return Result.ok(orderMapper.updateById(o) > 0);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> cancel(Long orderId) {
        Orders o = orderMapper.selectById(orderId);
        if (o == null) return Result.fail(404, "订单不存在");
        
        // 只有待审核(0)或待支付(1)可以取消
        if (o.getOrderStatus() != 0 && o.getOrderStatus() != 1) {
             return Result.fail(409, "当前状态不可取消");
        }

        if (o.getParentOrderId() != null) {
            List<Orders> siblings = orderMapper.selectList(Wrappers.<Orders>lambdaQuery()
                    .eq(Orders::getParentOrderId, o.getParentOrderId()));
            for (Orders sib : siblings) {
                releaseSeatsForOrder(sib);
            }
            return Result.ok(orderMapper.update(null, Wrappers.<Orders>lambdaUpdate()
                    .eq(Orders::getParentOrderId, o.getParentOrderId())
                    .set(Orders::getOrderStatus, OrderStatusEnum.CANCELLED.getCode())) > 0);
        }

        releaseSeatsForOrder(o);
        o.setOrderStatus(OrderStatusEnum.CANCELLED.getCode());
        return Result.ok(orderMapper.updateById(o) > 0);
    }

    @Override
    public Result<Boolean> delete(Long orderId) {
        Orders o = orderMapper.selectById(orderId);
        if (o == null) return Result.fail(404, "订单不存在");
        Integer s = o.getOrderStatus();
        if (s == 0 || s == 1 || s == 2) return Result.fail(409, "活跃订单不可删除");
        
        return Result.ok(orderMapper.deleteById(orderId) > 0);
    }

    private void releaseSeatsForOrder(Orders o) {
        if (o == null) return;
        try {
            if (o.getSeatId() != null) {
                seatService.releaseSeat(o.getSeatId());
            } else if (o.getOrderId() != null) {
                seatService.releaseSeats(o.getOrderId());
            }
        } catch (Exception e) {
            // 测试/降级场景（如 Redis 不可用）不应阻断管理端操作
            // 这里保持 best-effort：释放失败仍继续走状态流转
        }
    }
}
