package com.team.skylink.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.dto.RefundChangeApplyRequest;
import com.team.skylink.entity.Cabin;
import com.team.skylink.entity.Flight;
import com.team.skylink.entity.Order;
import com.team.skylink.entity.Payment;
import com.team.skylink.entity.RefundChangeRecord;
import com.team.skylink.mapper.CabinMapper;
import com.team.skylink.mapper.FlightMapper;
import com.team.skylink.mapper.OrderMapper;
import com.team.skylink.mapper.PaymentMapper;
import com.team.skylink.mapper.RefundRequestMapper;
import com.team.skylink.mapper.RefundChangeRecordMapper;
import com.team.skylink.mapper.UserMapper;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/refund-change")
public class RefundChangeController {
    private final OrderMapper orderMapper;
    private final PaymentMapper paymentMapper;
    private final FlightMapper flightMapper;
    private final CabinMapper cabinMapper;
    private final RefundChangeRecordMapper refundChangeRecordMapper;

    public RefundChangeController(OrderMapper orderMapper, PaymentMapper paymentMapper, FlightMapper flightMapper, CabinMapper cabinMapper, RefundChangeRecordMapper refundChangeRecordMapper) {
        this.orderMapper = orderMapper;
        this.paymentMapper = paymentMapper;
        this.flightMapper = flightMapper;
        this.cabinMapper = cabinMapper;
        this.refundChangeRecordMapper = refundChangeRecordMapper;
    }

    @PostMapping("/apply")
    public Result<Long> apply(@RequestBody RefundChangeApplyRequest req) {
        if (req.getOrderNo() == null || req.getOperType() == null) {
            return Result.fail(400, "invalid params");
        }
        Order o = orderMapper.selectById(req.getOrderNo());
        if (o == null) {
            return Result.fail(404, "order not found");
        }
        LocalDateTime now = LocalDateTime.now();
        if (req.getOperType() == 1) {
            Cabin oldCabin = cabinMapper.selectById(o.getCabinId());
            if (oldCabin != null) {
                oldCabin.setRemainingSeats(oldCabin.getRemainingSeats() + o.getTicketNum());
                cabinMapper.updateById(oldCabin);
            }
            o.setOrderStatus(3);
            o.setRefundTime(now);
            orderMapper.updateById(o);
            Payment p = paymentMapper.selectOne(new QueryWrapper<Payment>().eq("order_id", o.getOrderId()));
            if (p != null) {
                p.setPaymentStatus(4);
                p.setRefundTime(now);
                p.setUpdateTime(now);
                paymentMapper.updateById(p);
            }
            RefundChangeRecord r = new RefundChangeRecord();
            r.setOrderId(o.getOrderId());
            r.setOperType(1);
            r.setOldFlightId(o.getFlightId());
            r.setOldCabinId(o.getCabinId());
            r.setOperUserId(o.getUserId());
            r.setOperUserType(1);
            r.setAuditStatus(1);
            r.setOperTime(now);
            r.setAuditTime(now);
            r.setRemark(req.getRemark());
            refundChangeRecordMapper.insert(r);
            return Result.ok(r.getRecordId());
        } else if (req.getOperType() == 2) {
            if (req.getNewFlightNo() == null || req.getNewCabinType() == null) {
                return Result.fail(400, "invalid params");
            }
            Flight newFlight = flightMapper.selectOne(new QueryWrapper<Flight>().eq("flight_no", req.getNewFlightNo()));
            if (newFlight == null) {
                return Result.fail(404, "new flight not found");
            }
            Cabin newCabin = cabinMapper.selectOne(new QueryWrapper<Cabin>().eq("flight_id", newFlight.getFlightId()).eq("cabin_type", req.getNewCabinType()));
            if (newCabin == null) {
                return Result.fail(404, "new cabin not found");
            }
            if (newCabin.getRemainingSeats() < o.getTicketNum()) {
                return Result.fail(409, "insufficient seats");
            }
            Cabin oldCabin = cabinMapper.selectById(o.getCabinId());
            if (oldCabin != null) {
                oldCabin.setRemainingSeats(oldCabin.getRemainingSeats() + o.getTicketNum());
                cabinMapper.updateById(oldCabin);
            }
            newCabin.setRemainingSeats(newCabin.getRemainingSeats() - o.getTicketNum());
            cabinMapper.updateById(newCabin);
            o.setFlightId(newFlight.getFlightId());
            o.setCabinId(newCabin.getCabinId());
            o.setTotalAmount(newCabin.getPrice().multiply(java.math.BigDecimal.valueOf(o.getTicketNum())));
            o.setOrderStatus(5);
            o.setChangeTime(now);
            orderMapper.updateById(o);
            RefundChangeRecord r = new RefundChangeRecord();
            r.setOrderId(o.getOrderId());
            r.setOperType(2);
            r.setOldFlightId(oldCabin != null ? oldCabin.getFlightId() : o.getFlightId());
            r.setNewFlightId(newFlight.getFlightId());
            r.setOldCabinId(oldCabin != null ? oldCabin.getCabinId() : o.getCabinId());
            r.setNewCabinId(newCabin.getCabinId());
            r.setOperUserId(o.getUserId());
            r.setOperUserType(1);
            r.setAuditStatus(1);
            r.setOperTime(now);
            r.setAuditTime(now);
            r.setRemark(req.getRemark());
            refundChangeRecordMapper.insert(r);
            return Result.ok(r.getRecordId());
        }
        return Result.fail(400, "invalid operType");
    }
}
