package com.team.skylink.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentSearchResponse {
    private Long paymentId;
    private Long orderNo;
    private BigDecimal paymentAmount;
    private String paymentMethod;
    private Integer paymentStatus;
    private String tradeNo;
    private LocalDateTime paymentTime;
    private LocalDateTime refundTime;
}

