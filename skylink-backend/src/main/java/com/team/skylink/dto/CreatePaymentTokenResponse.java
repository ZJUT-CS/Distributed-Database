package com.team.skylink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class CreatePaymentTokenResponse {
    private Long orderNo;
    private BigDecimal amount;
    private Long timestamp;
    private String token;
    private Long expiresAt;
}

