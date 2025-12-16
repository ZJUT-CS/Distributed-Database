package com.team.skylink.dto;

import lombok.Data;

@Data
public class RefundChangeApplyRequest {
    private Long orderNo;
    private Integer operType;
    private String newFlightNo;
    private String newCabinType;
    private String remark;
}

