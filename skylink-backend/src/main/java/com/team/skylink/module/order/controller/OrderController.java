package com.team.skylink.module.order.controller;

import com.team.skylink.common.Result;
import com.team.skylink.common.PageResult;
import com.team.skylink.module.order.dto.OrderSearchResponse;
import com.team.skylink.module.order.dto.CreateOrderRequest;
import com.team.skylink.module.order.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

import org.springframework.web.bind.annotation.RequestBody;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("")
    public Result<PageResult<OrderSearchResponse>> search(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long orderNo,
            @RequestParam(required = false) Integer orderStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime createTimeStart,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime createTimeEnd,
            @RequestParam(required = false) String flightNo,
            @RequestParam(required = false) String cabinType,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return orderService.search(userId, orderNo, orderStatus, createTimeStart, createTimeEnd, flightNo, cabinType, page, size);
    }

    @GetMapping("/my")
    public Result<List<OrderSearchResponse>> listMy(@RequestParam Long userId) {
        return orderService.listMyOrders(userId);
    }

    @GetMapping("/{orderId}")
    public Result<OrderSearchResponse> getDetail(@PathVariable("orderId") Long orderId) {
        return orderService.getDetail(orderId);
    }

    @PostMapping("")
    public Result<OrderSearchResponse> create(HttpServletRequest request, @Valid @RequestBody CreateOrderRequest req) {
        Result<?> guard = ensureNonAdmin(request);
        if (guard != null) return (Result<OrderSearchResponse>) guard;
        return orderService.create(req);
    }

    @PostMapping("/{orderId}/cancellation")
    public Result<Boolean> cancel(@PathVariable("orderId") Long orderId) {
        return orderService.cancel(orderId);
    }

    @PutMapping("/{orderId}/seat")
    public Result<OrderSearchResponse> selectSeat(@PathVariable("orderId") Long orderId, @RequestBody Map<String, Object> body) {
        Object sid = body != null ? body.get("seatId") : null;
        if (sid == null) {
            sid = body != null ? body.get("newSeatId") : null;
        }
        Long seatId = sid instanceof Number ? ((Number) sid).longValue() : sid != null ? Long.valueOf(String.valueOf(sid)) : null;
        return orderService.selectSeat(orderId, seatId);
    }

    @PostMapping("/{orderId}/audit")
    public Result<Boolean> audit(HttpServletRequest request, @PathVariable("orderId") Long orderId, @RequestParam boolean approved) {
        Result<?> guard = ensureAdmin(request);
        if (guard != null) return (Result<Boolean>) guard;
        return orderService.audit(orderId, approved);
    }

    private static Result<?> ensureAdmin(HttpServletRequest request) {
        String t = request.getHeader("X-User-Type");
        if (t == null || (!"2".equals(t.trim()))) {
            return Result.fail(403, "需要管理员权限");
        }
        return null;
    }

    private static Result<?> ensureNonAdmin(HttpServletRequest request) {
        String t = request.getHeader("X-User-Type");
        if (t != null && "2".equals(t.trim())) {
            return Result.fail(403, "需要用户权限");
        }
        return null;
    }
}
