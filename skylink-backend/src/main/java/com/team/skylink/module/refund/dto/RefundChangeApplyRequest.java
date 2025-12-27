package com.team.skylink.module.refund.dto;

import lombok.Data;

import jakarta.validation.constraints.NotNull;

@Data
public class RefundChangeApplyRequest {
    @NotNull(message = "orderNo is required")
    private Long orderNo;

    @NotNull(message = "operType is required")
    private Integer operType;

    /**
     * 改签目标航班唯一标识（单段）。
     * 注意：flightNo 每天可复用，不能作为改签写入锚点。
     */
    private Long newFlightId;

    /**
     * 改签目标航班唯一标识（联程）。长度需与原订单航段数量一致。
     */
    private java.util.List<Long> newFlightIds;

    /**
     * 兼容字段（只读/过渡）：旧前端传 newFlightNo，不再允许用于改签写入。
     */
    private String newFlightNo;

    /**
     * 改签目标舱位类型（单段）：economy/business/first
     */
    private String newCabinType;

    /**
     * 改签目标舱位类型（联程）：长度需与 newFlightIds 一致
     */
    private java.util.List<String> newCabinTypes;

    private String remark;
}

