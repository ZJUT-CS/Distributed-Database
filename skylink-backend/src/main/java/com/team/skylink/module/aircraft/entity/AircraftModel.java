package com.team.skylink.module.aircraft.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 机型基础信息实体
 */
@Data
@TableName("aircraft_models")
public class AircraftModel {
    @TableId(value = "model_id", type = IdType.AUTO)
    private Long modelId;

    private String modelName;           // 机型名称 (如: Boeing 737-800)
    private String manufacturer;        // 制造商 (Boeing/Airbus)
    private Integer totalPhysicalSeats; // 物理座位总上限
    private String imageUrl;            // 机型图片URL
}
