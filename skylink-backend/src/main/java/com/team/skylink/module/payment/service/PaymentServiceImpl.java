package com.team.skylink.module.payment.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.enums.OrderStatusEnum;
import com.team.skylink.module.flight.service.SeatService;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.payment.dto.ConfirmPaymentRequest;
import com.team.skylink.module.payment.dto.CreatePaymentRequest;
import com.team.skylink.module.payment.dto.CreatePaymentTokenRequest;
import com.team.skylink.module.payment.dto.CreatePaymentTokenResponse;
import com.team.skylink.module.payment.dto.PaymentSearchResponse;
import com.team.skylink.module.payment.entity.Payment;
import com.team.skylink.module.payment.mapper.PaymentMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PaymentServiceImpl implements PaymentService {
    private final PaymentMapper paymentMapper;
    private final OrderMapper orderMapper;
    private final SeatService seatService;

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

    public PaymentServiceImpl(PaymentMapper paymentMapper, OrderMapper orderMapper, SeatService seatService) {
        this.paymentMapper = paymentMapper;
        this.orderMapper = orderMapper;
        this.seatService = seatService;
    }

    @Override
    public Result<PageResult<PaymentSearchResponse>> search(
            Long orderNo,
            Long userId,
            Integer paymentStatus,
            String paymentMethod,
            LocalDateTime paymentTimeStart,
            LocalDateTime paymentTimeEnd,
            int page,
            int size
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
            List<Orders> orders = orderMapper.selectList(new QueryWrapper<Orders>().eq("user_id", userId));
            if (orders.isEmpty()) {
                return Result.ok(new PageResult<>(0, new ArrayList<>()));
            }
            List<Long> orderIds = orders.stream().map(Orders::getOrderId).toList();
            qw.in("order_id", orderIds);
        }

        Long total = paymentMapper.selectCount(qw);
        
        int offset = (page - 1) * size;
        qw.last("limit " + offset + "," + size);

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
        return Result.ok(new PageResult<>(total, resp));
    }

    @Override
    public Result<CreatePaymentTokenResponse> createConfirmToken(CreatePaymentTokenRequest req) {
        Orders o = orderMapper.selectById(req.getOrderNo());
        if (o == null) {
            return Result.fail(404, "order not found");
        }
        if (o.getOrderStatus() != null && o.getOrderStatus() == OrderStatusEnum.CONFIRMED.getCode()) {
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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<PaymentSearchResponse> confirmPay(ConfirmPaymentRequest req) {
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

        Orders o = orderMapper.selectById(req.getOrderNo());
        if (o == null) {
            return Result.fail(404, "order not found");
        }
        if (o.getOrderStatus() != null && o.getOrderStatus() == OrderStatusEnum.CONFIRMED.getCode()) {
            return Result.fail(409, "order already paid");
        }
        if (o.getTotalAmount() != null && req.getAmount() != null && o.getTotalAmount().compareTo(req.getAmount()) != 0) {
            return Result.fail(400, "amount mismatch");
        }

        Long exists = paymentMapper.selectCount(new QueryWrapper<Payment>().eq("order_id", o.getOrderId()));
        if (exists != null && exists > 0) {
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

        LambdaUpdateWrapper<Orders> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Orders::getOrderId, o.getOrderId())
            .set(Orders::getOrderStatus, OrderStatusEnum.CONFIRMED.getCode())
                .set(Orders::getPayTime, payTime);
        orderMapper.update(null, updateWrapper);

        // 确认座位 (锁定 -> 已售)
        if (o.getSeatId() != null) {
            seatService.confirmSeat(o.getSeatId());
        } else {
            seatService.confirmSeats(o.getOrderId());
        }

        // 级联确认联程订单 (如果有)
        if (o.getParentOrderId() != null) {
            List<Orders> siblings = orderMapper.selectList(new QueryWrapper<Orders>()
                    .eq("parent_order_id", o.getParentOrderId())
                    .ne("order_id", o.getOrderId()));
            
            for (Orders sib : siblings) {
                // 仅处理待支付(1)的关联订单
                if (sib.getOrderStatus() != null && sib.getOrderStatus() == 1) {
                    // 为关联订单创建支付记录 (使用相同的交易号)
                    Payment sibPayment = new Payment();
                    sibPayment.setOrderId(sib.getOrderId());
                    sibPayment.setPaymentAmount(sib.getTotalAmount());
                    sibPayment.setPaymentMethod(p.getPaymentMethod());
                    sibPayment.setPaymentStatus(1);
                    sibPayment.setTradeNo(p.getTradeNo());
                    sibPayment.setPaymentTime(p.getPaymentTime());
                    sibPayment.setCreateTime(p.getCreateTime());
                    sibPayment.setUpdateTime(p.getUpdateTime());
                    paymentMapper.insert(sibPayment);

                    // 更新订单状态
                    LambdaUpdateWrapper<Orders> sibUpdate = new LambdaUpdateWrapper<>();
                    sibUpdate.eq(Orders::getOrderId, sib.getOrderId())
                            .set(Orders::getOrderStatus, 2) // 2=CONFIRMED
                            .set(Orders::getPayTime, payTime);
                    orderMapper.update(null, sibUpdate);

                    // 确认座位
                    if (sib.getSeatId() != null) {
                        seatService.confirmSeat(sib.getSeatId());
                    } else {
                        seatService.confirmSeats(sib.getOrderId());
                    }
                }
            }
        }

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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<PaymentSearchResponse> pay(CreatePaymentRequest req) {
        Orders o = orderMapper.selectById(req.getOrderNo());
        if (o == null) {
            return Result.fail(404, "order not found");
        }
        Long exists = paymentMapper.selectCount(new QueryWrapper<Payment>().eq("order_id", o.getOrderId()));
        if (exists != null && exists > 0) {
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
        o.setOrderStatus(OrderStatusEnum.CONFIRMED.getCode());
        o.setPayTime(now);
        orderMapper.updateById(o);
        
        // 确认座位 (锁定 -> 已售)
        if (o.getSeatId() != null) {
            seatService.confirmSeat(o.getSeatId());
        } else {
            seatService.confirmSeats(o.getOrderId());
        }
        
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

