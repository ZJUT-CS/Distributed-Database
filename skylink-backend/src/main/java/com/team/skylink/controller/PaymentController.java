package com.team.skylink.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.dto.PaymentSearchResponse;
import com.team.skylink.dto.CreatePaymentRequest;
import com.team.skylink.entity.Order;
import com.team.skylink.entity.Payment;
import com.team.skylink.mapper.OrderMapper;
import com.team.skylink.mapper.PaymentMapper;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.RequestBody;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/payments")
public class PaymentController {
    private final PaymentMapper paymentMapper;
    private final OrderMapper orderMapper;

    public PaymentController(PaymentMapper paymentMapper, OrderMapper orderMapper) {
        this.paymentMapper = paymentMapper;
        this.orderMapper = orderMapper;
    }

    @GetMapping("/search")
    public Result<List<PaymentSearchResponse>> search(
            @RequestParam(required = false) Long orderNo,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Integer paymentStatus,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime paymentTimeStart,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime paymentTimeEnd
    ) {
        QueryWrapper<Payment> qw = new QueryWrapper<>();
        if (orderNo != null) {
            qw.eq("order_id", orderNo);
        }
        if (paymentStatus != null) {
            qw.eq("payment_status", paymentStatus);
        }
        if (paymentMethod != null && !paymentMethod.isEmpty()) {
            qw.eq("payment_method", paymentMethod);
        }
        if (paymentTimeStart != null && paymentTimeEnd != null) {
            qw.between("payment_time", paymentTimeStart, paymentTimeEnd);
        } else if (paymentTimeStart != null) {
            qw.ge("payment_time", paymentTimeStart);
        } else if (paymentTimeEnd != null) {
            qw.le("payment_time", paymentTimeEnd);
        }
        if (userId != null) {
            List<Order> orders = orderMapper.selectList(new QueryWrapper<Order>().eq("user_id", userId));
            if (orders.isEmpty()) {
                return Result.ok(new ArrayList<>());
            }
            List<Long> orderIds = orders.stream().map(Order::getOrderId).toList();
            qw.in("order_id", orderIds);
        }

        List<Payment> payments = paymentMapper.selectList(qw);
        List<PaymentSearchResponse> resp = new ArrayList<>();
        for (Payment p : payments) {
            PaymentSearchResponse r = new PaymentSearchResponse();
            r.setPaymentId(p.getPaymentId());
            r.setOrderNo(p.getOrderId());
            r.setPaymentAmount(p.getPaymentAmount());
            r.setPaymentMethod(p.getPaymentMethod());
            r.setPaymentStatus(p.getPaymentStatus());
            r.setTradeNo(p.getTradeNo());
            r.setPaymentTime(p.getPaymentTime());
            r.setRefundTime(p.getRefundTime());
            resp.add(r);
        }
        return Result.ok(resp);
    }

    @PostMapping("/pay")
    public Result<PaymentSearchResponse> pay(@RequestBody CreatePaymentRequest req) {
        if (req.getOrderNo() == null || req.getAmount() == null || req.getMethod() == null) {
            return Result.fail(400, "invalid params");
        }
        Order o = orderMapper.selectById(req.getOrderNo());
        if (o == null) {
            return Result.fail(404, "order not found");
        }
        Payment exists = paymentMapper.selectOne(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<Payment>().eq("order_id", o.getOrderId()));
        if (exists != null) {
            return Result.fail(409, "payment already exists");
        }
        LocalDateTime now = LocalDateTime.now();
        Payment p = new Payment();
        p.setOrderId(o.getOrderId());
        p.setPaymentAmount(req.getAmount());
        p.setPaymentMethod(req.getMethod());
        p.setPaymentStatus(1);
        p.setTradeNo(UUID.randomUUID().toString());
        p.setPaymentTime(now);
        p.setCreateTime(now);
        p.setUpdateTime(now);
        paymentMapper.insert(p);
        o.setOrderStatus(1);
        o.setPayTime(now);
        orderMapper.updateById(o);
        PaymentSearchResponse r = new PaymentSearchResponse();
        r.setPaymentId(p.getPaymentId());
        r.setOrderNo(p.getOrderId());
        r.setPaymentAmount(p.getPaymentAmount());
        r.setPaymentMethod(p.getPaymentMethod());
        r.setPaymentStatus(p.getPaymentStatus());
        r.setTradeNo(p.getTradeNo());
        r.setPaymentTime(p.getPaymentTime());
        r.setRefundTime(p.getRefundTime());
        return Result.ok(r);
    }
}
