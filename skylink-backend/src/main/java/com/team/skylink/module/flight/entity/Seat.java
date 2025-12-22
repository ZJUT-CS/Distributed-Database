package com.team.skylink.module.flight.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 航班座位信息表实体
 */
@Data
@TableName("seat")
public class Seat {
    /**
     * 座位ID（自增主键）
     */
    @TableId(value = "seat_id", type = IdType.AUTO)
    private Long seatId;

    /**
     * 所属航班ID（关联航班表flight的主键）
     */
    private Long flightId;

    /**
     * 座位号（如：12A、3B）
     */
    private String seatNumber;

    /**
     * 舱位等级（如：ECONOMY/BUSINESS/FIRST）
     */
    private String cabinType;

    /**
     * 座位状态：1-可用，2-已售，3-锁定
     */
    private Integer status;

    /**
     * 更新时间（自动更新）
     */
    private LocalDateTime updateTime;

    /**
     * 占用该座位的订单ID
     */
    private Long orderId;

    /**
     * 占用该座位的用户ID (可选)
     */
    private Long userId;

    /**
     * 对应订单乘客列表下标 (可选，用于区分同一订单下不同乘客)
     */
    private Integer passengerIndex;

    /**
     * 乐观锁版本号
     */
    @Version
    private Integer version;
}