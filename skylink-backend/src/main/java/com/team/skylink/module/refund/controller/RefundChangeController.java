package com.team.skylink.module.refund.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.module.refund.dto.RefundChangeApplyRequest;
import com.team.skylink.module.refund.dto.RefundChangeSearchResponse;
import com.team.skylink.module.flight.entity.Cabin;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.order.entity.Order;
import com.team.skylink.module.payment.entity.Payment;
import com.team.skylink.module.refund.entity.RefundChangeRecord;
import com.team.skylink.module.flight.mapper.CabinMapper;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.payment.mapper.PaymentMapper;
import com.team.skylink.module.refund.mapper.RefundRequestMapper;
import com.team.skylink.module.refund.mapper.RefundChangeRecordMapper;
import com.team.skylink.module.auth.mapper.UserMapper;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping({"/refund-change", "/api/v1/refund-change"})
public class RefundChangeController {
    private final OrderMapper orderMapper;
    private final PaymentMapper paymentMapper;
    private final FlightMapper flightMapper;
    private final CabinMapper cabinMapper;
    private final RefundChangeRecordMapper refundChangeRecordMapper;
    private final UserMapper userMapper;

    public RefundChangeController(OrderMapper orderMapper,
                                 PaymentMapper paymentMapper,
                                 FlightMapper flightMapper,
                                 CabinMapper cabinMapper,
                                 RefundChangeRecordMapper refundChangeRecordMapper,
                                 UserMapper userMapper) {
        this.orderMapper = orderMapper;
        this.paymentMapper = paymentMapper;
        this.flightMapper = flightMapper;
        this.cabinMapper = cabinMapper;
        this.refundChangeRecordMapper = refundChangeRecordMapper;
        this.userMapper = userMapper;
    }

    @GetMapping("/search")
    public Result<List<RefundChangeSearchResponse>> search(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long orderNo
    ) {
        QueryWrapper<RefundChangeRecord> qw = new QueryWrapper<>();
        if (userId != null) {
            qw.eq("oper_user_id", userId);
        }
        if (orderNo != null) {
            qw.eq("order_id", orderNo);
        }
        qw.orderByDesc("oper_time");

        List<RefundChangeRecord> records = refundChangeRecordMapper.selectList(qw);
        if (records == null || records.isEmpty()) {
            return Result.ok(new ArrayList<>());
        }

        List<RefundChangeSearchResponse> resp = new ArrayList<>();
        for (RefundChangeRecord r : records) {
            RefundChangeSearchResponse dto = new RefundChangeSearchResponse();
            dto.setId(String.valueOf(r.getRecordId()));
            dto.setOrderId(String.valueOf(r.getOrderId()));
            var user = r.getOperUserId() != null ? userMapper.selectById(r.getOperUserId()) : null;
            dto.setPassenger(user != null && user.getRealName() != null ? user.getRealName() : String.valueOf(r.getOperUserId()));
            dto.setType(r.getOperType() != null && r.getOperType() == 2 ? "改签" : "退票");

            Flight oldFlight = r.getOldFlightId() != null ? flightMapper.selectById(r.getOldFlightId()) : null;
            Flight newFlight = r.getNewFlightId() != null ? flightMapper.selectById(r.getNewFlightId()) : null;
            dto.setOldFlight(oldFlight != null ? oldFlight.getFlightNo() : "-");
            dto.setNewFlight(newFlight != null ? newFlight.getFlightNo() : "-");

            dto.setApplyTime(r.getOperTime() != null ? r.getOperTime().toString() : "");
            dto.setRemark(r.getRemark());

            Integer auditStatus = r.getAuditStatus();
            if (auditStatus == null || auditStatus == 0) {
                dto.setStatus("pending");
            } else if (auditStatus == 2) {
                dto.setStatus("rejected");
            } else {
                dto.setStatus("approved");
            }

            resp.add(dto);
        }
        return Result.ok(resp);
    }

    @PostMapping("/apply")
    public Result<Long> apply(@Valid @RequestBody RefundChangeApplyRequest req) {
        Order o = orderMapper.selectById(req.getOrderNo());
        if (o == null) {
            return Result.fail(404, "order not found");
        }
        LocalDateTime now = LocalDateTime.now();
        Integer operType = req.getOperType();
        if (operType == null || (operType != 1 && operType != 2)) {
            return Result.fail(400, "invalid operType");
        }

        RefundChangeRecord r = new RefundChangeRecord();
        r.setOrderId(o.getOrderId());
        r.setOperType(operType);
        r.setOldFlightId(o.getFlightId());
        r.setOldCabinId(o.getCabinId());
        r.setOperUserId(o.getUserId());
        r.setOperUserType(1);
        r.setAuditStatus(0); // pending
        r.setOperTime(now);
        r.setRemark(req.getRemark());

        if (operType == 2) {
            if (req.getNewFlightNo() == null || req.getNewFlightNo().isBlank() || req.getNewCabinType() == null || req.getNewCabinType().isBlank()) {
                return Result.fail(400, "newFlightNo and newCabinType are required for change");
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
            r.setNewFlightId(newFlight.getFlightId());
            r.setNewCabinId(newCabin.getCabinId());
        }

        refundChangeRecordMapper.insert(r);

        // 标记订单进入退改审核中（不立即改写座位/支付/订单核心字段）
        o.setOrderStatus(4);
        orderMapper.updateById(o);

        return Result.ok(r.getRecordId());
    }

    @PostMapping("/{recordId}/approve")
    public Result<Boolean> approve(@PathVariable("recordId") Long recordId) {
        RefundChangeRecord r = refundChangeRecordMapper.selectById(recordId);
        if (r == null) return Result.fail(404, "record not found");
        if (r.getAuditStatus() == null || r.getAuditStatus() != 0) return Result.fail(409, "record is not pending");

        Order o = orderMapper.selectById(r.getOrderId());
        if (o == null) return Result.fail(404, "order not found");

        LocalDateTime now = LocalDateTime.now();
        if (r.getOperType() != null && r.getOperType() == 1) {
            // refund
            Cabin oldCabin = cabinMapper.selectById(o.getCabinId());
            if (oldCabin != null && o.getTicketNum() != null) {
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
        } else {
            // change
            if (r.getNewFlightId() == null || r.getNewCabinId() == null) return Result.fail(400, "missing new flight/cabin");
            Cabin newCabin = cabinMapper.selectById(r.getNewCabinId());
            if (newCabin == null) return Result.fail(404, "new cabin not found");
            if (newCabin.getRemainingSeats() < o.getTicketNum()) return Result.fail(409, "insufficient seats");

            Cabin oldCabin = cabinMapper.selectById(o.getCabinId());
            if (oldCabin != null && o.getTicketNum() != null) {
                oldCabin.setRemainingSeats(oldCabin.getRemainingSeats() + o.getTicketNum());
                cabinMapper.updateById(oldCabin);
            }
            newCabin.setRemainingSeats(newCabin.getRemainingSeats() - o.getTicketNum());
            cabinMapper.updateById(newCabin);

            o.setFlightId(r.getNewFlightId());
            o.setCabinId(r.getNewCabinId());
            o.setTotalAmount(newCabin.getPrice().multiply(java.math.BigDecimal.valueOf(o.getTicketNum())));
            o.setOrderStatus(5);
            o.setChangeTime(now);
            orderMapper.updateById(o);
        }

        r.setAuditStatus(1);
        r.setAuditTime(now);
        refundChangeRecordMapper.updateById(r);
        return Result.ok(true);
    }

    @PostMapping("/{recordId}/reject")
    public Result<Boolean> reject(@PathVariable("recordId") Long recordId) {
        RefundChangeRecord r = refundChangeRecordMapper.selectById(recordId);
        if (r == null) return Result.fail(404, "record not found");
        if (r.getAuditStatus() == null || r.getAuditStatus() != 0) return Result.fail(409, "record is not pending");

        Order o = orderMapper.selectById(r.getOrderId());
        if (o != null && o.getOrderStatus() != null && o.getOrderStatus() == 4) {
            Payment p = paymentMapper.selectOne(new QueryWrapper<Payment>().eq("order_id", o.getOrderId()));
            o.setOrderStatus(p != null ? 1 : 0);
            orderMapper.updateById(o);
        }

        r.setAuditStatus(2);
        r.setAuditTime(LocalDateTime.now());
        refundChangeRecordMapper.updateById(r);
        return Result.ok(true);
    }

    @DeleteMapping("/{recordId}")
    public Result<Boolean> revoke(@PathVariable("recordId") Long recordId) {
        RefundChangeRecord r = refundChangeRecordMapper.selectById(recordId);
        if (r == null) return Result.fail(404, "record not found");
        if (r.getAuditStatus() == null || r.getAuditStatus() != 0) return Result.fail(409, "record is not pending");

        Order o = orderMapper.selectById(r.getOrderId());
        if (o != null && o.getOrderStatus() != null && o.getOrderStatus() == 4) {
            Payment p = paymentMapper.selectOne(new QueryWrapper<Payment>().eq("order_id", o.getOrderId()));
            o.setOrderStatus(p != null ? 1 : 0);
            orderMapper.updateById(o);
        }

        refundChangeRecordMapper.deleteById(recordId);
        return Result.ok(true);
    }

    @PutMapping("/{recordId}")
    public Result<Boolean> updatePending(@PathVariable("recordId") Long recordId, @RequestBody RefundChangeApplyRequest req) {
        RefundChangeRecord r = refundChangeRecordMapper.selectById(recordId);
        if (r == null) return Result.fail(404, "record not found");
        Integer auditStatus = r.getAuditStatus();
        if (auditStatus == null || (auditStatus != 0 && auditStatus != 2)) return Result.fail(409, "record is not editable");

        // 重新提交：将状态重置为 pending
        if (auditStatus == 2) {
            r.setAuditStatus(0);
            r.setAuditTime(null);
        }

        if (req.getRemark() != null) {
            r.setRemark(req.getRemark());
        }
        if (r.getOperType() != null && r.getOperType() == 2) {
            String newFlightNo = req.getNewFlightNo() != null ? req.getNewFlightNo().trim() : "";
            String newCabinType = req.getNewCabinType() != null ? req.getNewCabinType().trim() : "";
            if (!newFlightNo.isEmpty()) {
                Flight newFlight = flightMapper.selectOne(new QueryWrapper<Flight>().eq("flight_no", newFlightNo));
                if (newFlight == null) return Result.fail(404, "new flight not found");

                if (newCabinType.isEmpty()) {
                    Cabin oldCabin = cabinMapper.selectById(r.getOldCabinId());
                    if (oldCabin != null && oldCabin.getCabinType() != null) {
                        newCabinType = oldCabin.getCabinType();
                    }
                }
                if (newCabinType.isEmpty()) return Result.fail(400, "missing newCabinType");

                Cabin newCabin = cabinMapper.selectOne(new QueryWrapper<Cabin>().eq("flight_id", newFlight.getFlightId()).eq("cabin_type", newCabinType));
                if (newCabin == null) return Result.fail(404, "new cabin not found");

                r.setNewFlightId(newFlight.getFlightId());
                r.setNewCabinId(newCabin.getCabinId());
            }
        }
        r.setOperTime(LocalDateTime.now());
        refundChangeRecordMapper.updateById(r);
        return Result.ok(true);
    }
}
