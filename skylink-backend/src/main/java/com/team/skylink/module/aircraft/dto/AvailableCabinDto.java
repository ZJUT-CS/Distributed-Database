package com.team.skylink.module.aircraft.dto;

import lombok.Data;
import java.math.BigDecimal;

/**
 * 可用舱位配置响应DTO
 */
@Data
public class AvailableCabinDto {
    /**
     * 舱位配置ID
     */
    private Long configId;

    /**
     * 舱位类型代码 (Y/J/F)
     */
    private String cabinType;

    /**
     * 舱位名称
     */
    private String cabinName;

    /**
     * 该舱位可用座位数
     */
    private Integer availableSeats;

    /**
     * 舱位系数
     */
    private BigDecimal coefficient;

    /**
     * 默认随身行李额
     */
    private String carryOn;

    /**
     * 默认托运行李额
     */
    private String checked;

    /**
     * 服务描述
     */
    private String services;
}
