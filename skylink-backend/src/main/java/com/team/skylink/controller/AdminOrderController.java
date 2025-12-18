package com.team.skylink.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.dto.AdminOrderStatusRequest;
import com.team.skylink.entity.Cabin;
import com.team.skylink.entity.Flight;
import com.team.skylink.entity.Order;
import com.team.skylink.entity.User;
import com.team.skylink.mapper.CabinMapper;
import com.team.skylink.mapper.FlightMapper;
import com.team.skylink.mapper.OrderMapper;
import com.team.skylink.mapper.UserMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {
    private final OrderMapper orderMapper;
    private final FlightMapper flightMapper;
    private final UserMapper userMapper;
    private final CabinMapper cabinMapper;

    public AdminOrderController(OrderMapper orderMapper, FlightMapper flightMapper, UserMapper userMapper, CabinMapper cabinMapper) {
        this.orderMapper = orderMapper;
        this.flightMapper = flightMapper;
        this.userMapper = userMapper;
        this.cabinMapper = cabinMapper;
    }

    @GetMapping
    public Result<PageResult<AdminOrderItem>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long orderNo,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Integer orderStatus,
            @RequestParam(required = false) String flightNo
    ) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<PageResult<AdminOrderItem>>) adminGuard;

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

        List<AdminOrderItem> items = new ArrayList<>();
        for (Order o : orders) {
            AdminOrderItem it = new AdminOrderItem();
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

    @PutMapping("/{orderId}/status")
    public Result<Boolean> updateStatus(
            HttpServletRequest request,
            @PathVariable("orderId") Long orderId,
            @Valid @RequestBody AdminOrderStatusRequest body
    ) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        if (orderId == null) return Result.fail(400, "orderId is required");
        Order o = orderMapper.selectById(orderId);
        if (o == null) return Result.fail(404, "order not found");

        Integer from = o.getOrderStatus();
        Integer to = body.getOrderStatus();
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

    @PutMapping("/{orderId}/cancel")
    public Result<Boolean> cancel(HttpServletRequest request, @PathVariable("orderId") Long orderId) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

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

    @DeleteMapping("/{orderId}")
    public Result<Boolean> delete(HttpServletRequest request, @PathVariable("orderId") Long orderId) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        if (orderId == null) return Result.fail(400, "orderId is required");
        Order o = orderMapper.selectById(orderId);
        if (o == null) return Result.fail(404, "order not found");
        if (o.getOrderStatus() != null && o.getOrderStatus() == 0) {
            return Result.fail(409, "pending order cannot be deleted");
        }
        int rows = orderMapper.deleteById(orderId);
        return Result.ok(rows > 0);
    }

    private static Result<?> ensureAdmin(HttpServletRequest request) {
        String t = request.getHeader("X-User-Type");
        if (t == null || (!"2".equals(t.trim()))) {
            return Result.fail(403, "admin required");
        }
        return null;
    }

    public static class AdminOrderItem {
        private Long orderNo;
        private Long userId;
        private Integer orderStatus;
        private Integer ticketNum;
        private java.math.BigDecimal totalAmount;
        private java.time.LocalDateTime orderTime;
        private java.time.LocalDateTime payTime;
        private java.time.LocalDateTime refundTime;
        private java.time.LocalDateTime changeTime;

        private Long flightId;
        private Long cabinId;
        private String flightNo;
        private String origin;
        private String destination;
        private java.time.LocalDateTime departureTime;
        private java.time.LocalDateTime arrivalTime;

        private String passengerName;
        private String email;
        private String phoneNumber;

        public Long getOrderNo() {
            return orderNo;
        }

        public void setOrderNo(Long orderNo) {
            this.orderNo = orderNo;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public Integer getOrderStatus() {
            return orderStatus;
        }

        public void setOrderStatus(Integer orderStatus) {
            this.orderStatus = orderStatus;
        }

        public Integer getTicketNum() {
            return ticketNum;
        }

        public void setTicketNum(Integer ticketNum) {
            this.ticketNum = ticketNum;
        }

        public java.math.BigDecimal getTotalAmount() {
            return totalAmount;
        }

        public void setTotalAmount(java.math.BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
        }

        public java.time.LocalDateTime getOrderTime() {
            return orderTime;
        }

        public void setOrderTime(java.time.LocalDateTime orderTime) {
            this.orderTime = orderTime;
        }

        public java.time.LocalDateTime getPayTime() {
            return payTime;
        }

        public void setPayTime(java.time.LocalDateTime payTime) {
            this.payTime = payTime;
        }

        public java.time.LocalDateTime getRefundTime() {
            return refundTime;
        }

        public void setRefundTime(java.time.LocalDateTime refundTime) {
            this.refundTime = refundTime;
        }

        public java.time.LocalDateTime getChangeTime() {
            return changeTime;
        }

        public void setChangeTime(java.time.LocalDateTime changeTime) {
            this.changeTime = changeTime;
        }

        public Long getFlightId() {
            return flightId;
        }

        public void setFlightId(Long flightId) {
            this.flightId = flightId;
        }

        public Long getCabinId() {
            return cabinId;
        }

        public void setCabinId(Long cabinId) {
            this.cabinId = cabinId;
        }

        public String getFlightNo() {
            return flightNo;
        }

        public void setFlightNo(String flightNo) {
            this.flightNo = flightNo;
        }

        public String getOrigin() {
            return origin;
        }

        public void setOrigin(String origin) {
            this.origin = origin;
        }

        public String getDestination() {
            return destination;
        }

        public void setDestination(String destination) {
            this.destination = destination;
        }

        public java.time.LocalDateTime getDepartureTime() {
            return departureTime;
        }

        public void setDepartureTime(java.time.LocalDateTime departureTime) {
            this.departureTime = departureTime;
        }

        public java.time.LocalDateTime getArrivalTime() {
            return arrivalTime;
        }

        public void setArrivalTime(java.time.LocalDateTime arrivalTime) {
            this.arrivalTime = arrivalTime;
        }

        public String getPassengerName() {
            return passengerName;
        }

        public void setPassengerName(String passengerName) {
            this.passengerName = passengerName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }
    }
}
