package com.team.skylink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class CreatePaymentTokenResponse {
    private String orderNo;
    private BigDecimal amount;
    private Long timestamp;
    private String token;
    private Long expiresAt;
}

