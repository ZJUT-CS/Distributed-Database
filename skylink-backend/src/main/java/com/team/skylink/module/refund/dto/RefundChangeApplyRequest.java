package com.team.skylink.module.refund.dto;

import lombok.Data;

import jakarta.validation.constraints.NotNull;

@Data
public class RefundChangeApplyRequest {
    @NotNull(message = "orderNo is required")
    private Long orderNo;

    @NotNull(message = "operType is required")
    private Integer operType;
    private String newFlightNo;
    private String newCabinType;
    private String remark;
}

