package com.team.skylink.module.flight.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 航线基础信息实体
 */
@Data
@TableName("routes")
public class Route {
    /**
     * 航线ID
     */
    @TableId(value = "route_id", type = IdType.AUTO)
    private Long routeId;

    /**
     * 出发城市 (如: 上海)
     */
    private String departureCity;

    /**
     * 出发机场三字码 (如: SHA)
     */
    private String departureAirport;

    /**
     * 到达城市 (如: 北京)
     */
    private String arrivalCity;

    /**
     * 到达机场三字码 (如: PEK)
     */
    private String arrivalAirport;

    /**
     * 经济舱基准票价 (用于计算)
     */
    private BigDecimal basePrice;

    /**
     * 预计飞行时长 (分钟)
     */
    private Integer estimatedDuration;

    /**
     * 航线距离 (公里)
     */
    private Integer distanceKm;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间 (数据变动时自动更新)
     */
    private LocalDateTime updateTime;
}
