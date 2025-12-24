package com.team.skylink.module.admin.controller;

import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.AdminOrderStatusRequest;
import com.team.skylink.module.admin.service.AdminOrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/admins/orders")
public class AdminOrderController {
    
    private final AdminOrderService adminOrderService;

    public AdminOrderController(AdminOrderService adminOrderService) {
        this.adminOrderService = adminOrderService;
    }

    // 1. 分页查询列表
    @GetMapping
    public Result<PageResult<AdminOrderItem>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) Long orderNo,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Integer orderStatus,
            @RequestParam(required = false) String flightNo
    ) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<PageResult<AdminOrderItem>>) adminGuard;
        return adminOrderService.list(page, size, orderNo, userId, orderStatus, flightNo);
    }

    // 2. 更新订单状态 (通用)
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

    // 3. 取消订单
    @PutMapping("/{orderId}/cancellation")
    public Result<Boolean> cancel(HttpServletRequest request, @PathVariable("orderId") Long orderId) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;
        return adminOrderService.cancel(orderId);
    }

    // 4. 删除订单
    @DeleteMapping("/{orderId}")
    public Result<Boolean> delete(HttpServletRequest request, @PathVariable("orderId") Long orderId) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;
        return adminOrderService.delete(orderId);
    }

    @PostMapping("/{orderId}/audits")
    public Result<Boolean> auditOrder(HttpServletRequest request, @PathVariable("orderId") Long orderId, @Valid @RequestBody AuditRequest body) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        return adminOrderService.auditOrder(orderId, body.getPass());
    }

    // --- 辅助方法 ---
    private static Result<?> ensureAdmin(HttpServletRequest request) {
        String t = request.getHeader("X-User-Type");
        // 假设 2 代表管理员
        if (t == null || (!"2".equals(t.trim()))) {
            return Result.fail(403, "admin required");
        }
        return null;
    }

    // --- DTO: 列表项 ---
    public static class AuditRequest {
        @NotNull
        private Boolean pass;

        public Boolean getPass() { return pass; }

        public void setPass(Boolean pass) { this.pass = pass; }
    }

    public static class AdminOrderItem {
        private Long orderNo;
        private Long userId;
        private Integer orderStatus;
        private Integer ticketNum;
        private BigDecimal totalAmount;
        private LocalDateTime orderTime;
        private LocalDateTime payTime;
        private LocalDateTime refundTime;
        private LocalDateTime changeTime;

        private Long flightId;
        private Long cabinId;
        private String flightNo;
        private String origin;
        private String destination;
        private LocalDateTime departureTime;
        private LocalDateTime arrivalTime;

        private String passengerName;
        private String email;
        private String phoneNumber;

        // Getters and Setters
        public Long getOrderNo() { return orderNo; }
        public void setOrderNo(Long orderNo) { this.orderNo = orderNo; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public Integer getOrderStatus() { return orderStatus; }
        public void setOrderStatus(Integer orderStatus) { this.orderStatus = orderStatus; }
        public Integer getTicketNum() { return ticketNum; }
        public void setTicketNum(Integer ticketNum) { this.ticketNum = ticketNum; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        public LocalDateTime getOrderTime() { return orderTime; }
        public void setOrderTime(LocalDateTime orderTime) { this.orderTime = orderTime; }
        public LocalDateTime getPayTime() { return payTime; }
        public void setPayTime(LocalDateTime payTime) { this.payTime = payTime; }
        public LocalDateTime getRefundTime() { return refundTime; }
        public void setRefundTime(LocalDateTime refundTime) { this.refundTime = refundTime; }
        public LocalDateTime getChangeTime() { return changeTime; }
        public void setChangeTime(LocalDateTime changeTime) { this.changeTime = changeTime; }
        public Long getFlightId() { return flightId; }
        public void setFlightId(Long flightId) { this.flightId = flightId; }
        public Long getCabinId() { return cabinId; }
        public void setCabinId(Long cabinId) { this.cabinId = cabinId; }
        public String getFlightNo() { return flightNo; }
        public void setFlightNo(String flightNo) { this.flightNo = flightNo; }
        public String getOrigin() { return origin; }
        public void setOrigin(String origin) { this.origin = origin; }
        public String getDestination() { return destination; }
        public void setDestination(String destination) { this.destination = destination; }
        public LocalDateTime getDepartureTime() { return departureTime; }
        public void setDepartureTime(LocalDateTime departureTime) { this.departureTime = departureTime; }
        public LocalDateTime getArrivalTime() { return arrivalTime; }
        public void setArrivalTime(LocalDateTime arrivalTime) { this.arrivalTime = arrivalTime; }
        public String getPassengerName() { return passengerName; }
        public void setPassengerName(String passengerName) { this.passengerName = passengerName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    }
}
