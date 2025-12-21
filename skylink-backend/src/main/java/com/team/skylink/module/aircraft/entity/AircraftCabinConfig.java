package com.team.skylink.module.aircraft.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 机型舱位配置详情实体
 */
@Data
@TableName("aircraft_cabin_configs")
public class AircraftCabinConfig {
    /**
     * 配置ID
     */
    @TableId(value = "config_id", type = IdType.AUTO)
    private Long configId;

    /**
     * 关联机型ID
     */
    private Long modelId;

    /**
     * 舱位类型 (ECONOMY, BUSINESS, FIRST)
     */
    private String cabinType;

    /**
     * 舱位系数（最终票价=航线基础价×该系数×季节/供需系数）
     */
    private BigDecimal cabinCoefficient;

    /**
     * 舱位布局方案号（如1/2/3，标识机型的第N种布局方案）
     */
    private Integer cabinLayoutNo;

    /**
     * 该舱位分配的座位数
     */
    private Integer capacity;

    /**
     * 默认随身行李额
     */
    private String defaultCarryOn;

    /**
     * 默认托运行李额
     */
    private String defaultChecked;

    /**
     * 该舱位默认服务描述
     */
    private String defaultServices;

    // 【新增】起始行号
    private Integer startRowNum;

    // 【新增】列布局 (如 "ABCHJK")
    private String seatColLayout;
}
