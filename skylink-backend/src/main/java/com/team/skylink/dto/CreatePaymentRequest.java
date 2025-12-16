package com.team.skylink.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePaymentRequest {
    private Long orderNo;
    private BigDecimal amount;
    private String method;
}

