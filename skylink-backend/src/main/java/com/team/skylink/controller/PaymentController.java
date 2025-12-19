package com.team.skylink.controller;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper; // 必须导入这个
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.dto.ConfirmPaymentRequest;
import com.team.skylink.dto.CreatePaymentTokenRequest;
import com.team.skylink.dto.CreatePaymentTokenResponse;
import com.team.skylink.dto.PaymentSearchResponse;
import com.team.skylink.dto.CreatePaymentRequest;
import com.team.skylink.entity.Order;
import com.team.skylink.entity.Payment;
import com.team.skylink.mapper.OrderMapper;
import com.team.skylink.mapper.PaymentMapper;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping({"/payments", "/api/v1/payments"})
public class PaymentController {
    private final PaymentMapper paymentMapper;
    private final OrderMapper orderMapper;

    public PaymentController(PaymentMapper paymentMapper, OrderMapper orderMapper) {
        this.paymentMapper = paymentMapper;
        this.orderMapper = orderMapper;
    }

    private static final long PAYMENT_TOKEN_TTL_MS = 30L * 60L * 1000L;

    private static final class PaymentTokenRecord {
        private final Long orderNo;
        private final BigDecimal amount;
        private final long timestamp;
        private final long expiresAt;
        private volatile boolean used;

        private PaymentTokenRecord(Long orderNo, BigDecimal amount, long timestamp, long expiresAt) {
            this.orderNo = orderNo;
            this.amount = amount;
            this.timestamp = timestamp;
            this.expiresAt = expiresAt;
            this.used = false;
        }
    }

    private static final ConcurrentHashMap<String, PaymentTokenRecord> PAYMENT_TOKENS = new ConcurrentHashMap<>();

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
            r.setPaymentId(String.valueOf(p.getPaymentId()));
            r.setOrderNo(String.valueOf(p.getOrderId()));
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

    @PostMapping("/confirm-token")
    public Result<CreatePaymentTokenResponse> createConfirmToken(@Valid @RequestBody CreatePaymentTokenRequest req) {
        Order o = orderMapper.selectById(req.getOrderNo());
        if (o == null) {
            return Result.fail(404, "order not found");
        }
        if (o.getOrderStatus() != null && o.getOrderStatus() == 1) {
            return Result.fail(409, "order already paid");
        }
        if (o.getTotalAmount() != null && req.getAmount() != null && o.getTotalAmount().compareTo(req.getAmount()) != 0) {
            return Result.fail(400, "amount mismatch");
        }

        long now = System.currentTimeMillis();
        long expiresAt = now + PAYMENT_TOKEN_TTL_MS;
        String token = UUID.randomUUID().toString();
        PAYMENT_TOKENS.put(token, new PaymentTokenRecord(req.getOrderNo(), req.getAmount(), now, expiresAt));
        return Result.ok(new CreatePaymentTokenResponse(String.valueOf(req.getOrderNo()), req.getAmount(), now, token, expiresAt));
    }

    @PostMapping("/confirm")
    @Transactional(rollbackFor = Exception.class)
    public Result<PaymentSearchResponse> confirmPay(@Valid @RequestBody ConfirmPaymentRequest req) {
        PaymentTokenRecord record = PAYMENT_TOKENS.get(req.getToken());
        if (record == null) {
            return Result.fail(400, "invalid token");
        }
        long now = System.currentTimeMillis();
        if (record.expiresAt < now) {
            PAYMENT_TOKENS.remove(req.getToken());
            return Result.fail(400, "token expired");
        }
        if (!record.orderNo.equals(req.getOrderNo())) {
            return Result.fail(400, "orderNo mismatch");
        }
        if (record.amount != null && req.getAmount() != null && record.amount.compareTo(req.getAmount()) != 0) {
            return Result.fail(400, "amount mismatch");
        }
        if (record.timestamp != req.getTimestamp()) {
            return Result.fail(400, "timestamp mismatch");
        }

        synchronized (record) {
            if (record.used) {
                return Result.fail(409, "token already used");
            }
            record.used = true;
        }
        PAYMENT_TOKENS.remove(req.getToken());

        Order o = orderMapper.selectById(req.getOrderNo());
        if (o == null) {
            return Result.fail(404, "order not found");
        }
        if (o.getOrderStatus() != null && o.getOrderStatus() == 1) {
            return Result.fail(409, "order already paid");
        }
        if (o.getTotalAmount() != null && req.getAmount() != null && o.getTotalAmount().compareTo(req.getAmount()) != 0) {
            return Result.fail(400, "amount mismatch");
        }

        Payment exists = paymentMapper.selectOne(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<Payment>().eq("order_id", o.getOrderId()));
        if (exists != null) {
            return Result.fail(409, "payment already exists");
        }

        LocalDateTime payTime = LocalDateTime.now();
        Payment p = new Payment();
        p.setOrderId(o.getOrderId());
        p.setPaymentAmount(req.getAmount());
        p.setPaymentMethod(req.getMethod());
        p.setPaymentStatus(1);
        p.setTradeNo(UUID.randomUUID().toString());
        p.setPaymentTime(payTime);
        p.setCreateTime(payTime);
        p.setUpdateTime(payTime);
        paymentMapper.insert(p);

        // 使用 LambdaUpdateWrapper 仅更新状态和支付时间，避免更新分片键(userId)导致的错误
        LambdaUpdateWrapper<Order> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Order::getOrderId, o.getOrderId())
                     .set(Order::getOrderStatus, 1)
                     .set(Order::getPayTime, payTime);
        orderMapper.update(null, updateWrapper);

        PaymentSearchResponse r = new PaymentSearchResponse();
        r.setPaymentId(String.valueOf(p.getPaymentId()));
        r.setOrderNo(String.valueOf(p.getOrderId()));
        r.setPaymentAmount(p.getPaymentAmount());
        r.setPaymentMethod(p.getPaymentMethod());
        r.setPaymentStatus(p.getPaymentStatus());
        r.setTradeNo(p.getTradeNo());
        r.setPaymentTime(p.getPaymentTime());
        r.setRefundTime(p.getRefundTime());
        return Result.ok(r);
    }

    @PostMapping("/pay")
    @Transactional(rollbackFor = Exception.class)
    public Result<PaymentSearchResponse> pay(@Valid @RequestBody CreatePaymentRequest req) {
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
        r.setPaymentId(String.valueOf(p.getPaymentId()));
        r.setOrderNo(String.valueOf(p.getOrderId()));
        r.setPaymentAmount(p.getPaymentAmount());
        r.setPaymentMethod(p.getPaymentMethod());
        r.setPaymentStatus(p.getPaymentStatus());
        r.setTradeNo(p.getTradeNo());
        r.setPaymentTime(p.getPaymentTime());
        r.setRefundTime(p.getRefundTime());
        return Result.ok(r);
    }
}
