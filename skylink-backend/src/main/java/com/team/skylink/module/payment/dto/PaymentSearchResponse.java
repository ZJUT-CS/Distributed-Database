package com.team.skylink.module.payment.dto;

import lombok.Data;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentSearchResponse {
    private String paymentId;
    private String orderNo;
    private BigDecimal paymentAmount;
    private String paymentMethod;
    private Integer paymentStatus;
    private String tradeNo;
    private LocalDateTime paymentTime;
    private LocalDateTime refundTime;
}

