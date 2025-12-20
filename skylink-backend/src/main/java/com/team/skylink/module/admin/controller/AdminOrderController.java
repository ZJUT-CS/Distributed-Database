package com.team.skylink.module.admin.controller;

import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.AdminOrderStatusRequest;
import com.team.skylink.module.admin.service.AdminOrderService;
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

@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {
    private final AdminOrderService adminOrderService;

    public AdminOrderController(AdminOrderService adminOrderService) {
        this.adminOrderService = adminOrderService;
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
        return adminOrderService.list(page, size, orderNo, userId, orderStatus, flightNo);
    }

    @PutMapping("/{orderId}/status")
    public Result<Boolean> updateStatus(
            HttpServletRequest request,
            @PathVariable("orderId") Long orderId,
            @Valid @RequestBody AdminOrderStatusRequest body
    ) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;
        return adminOrderService.updateStatus(orderId, body.getOrderStatus());
    }

    @PutMapping("/{orderId}/cancel")
    public Result<Boolean> cancel(HttpServletRequest request, @PathVariable("orderId") Long orderId) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;
        return adminOrderService.cancel(orderId);
    }

    @DeleteMapping("/{orderId}")
    public Result<Boolean> delete(HttpServletRequest request, @PathVariable("orderId") Long orderId) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;
        return adminOrderService.delete(orderId);
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
