package com.team.skylink.module.flight.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 航班计划/实例表实体
 */
@Data
@TableName("flights")
public class Flight {
    /**
     * 航班ID，主键(雪花算法生成)
     */
    @TableId(value = "flight_id", type = IdType.ASSIGN_ID)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long flightId;

    /**
     * 航班班次（如CA1234，注意：每天可复用，不能设唯一键）
     */
    private String flightNo;

    /**
     * 机型ID (关联 aircraft_models，用于确定总座位和布局)
     */
    private Long modelId;

    /**
     * 航线ID (关联 routes，用于确定基准票价和预计时长)
     */
    private Long routeId;

    /**
     * 计划起飞时间
     */
    private LocalDateTime departureTime;

    /**
     * 计划到达时间
     */
    private LocalDateTime arrivalTime;

    /**
     * 出发城市 (冗余)
     */
    private String departureCity;

    /**
     * 出发机场 (冗余)
     */
    private String departureAirport;

    /**
     * 到达城市 (冗余)
     */
    private String arrivalCity;

    /**
     * 到达机场 (冗余)
     */
    private String arrivalAirport;

    /**
     * 航空公司
     */
    private String airlineCompany;

    /**
     * 总座位数 (从 aircraft_models 冗余，方便显示余票进度)
     */
    private Integer totalSeats;

    /**
     * 经停信息
     */
    private String stopoverInfo;

    /**
     * 状态：1-计划中，2-取消，3-延误，4-已起飞，5-已到达
     */
    private Integer status;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;

    /**
     * 最低票价(冗余字段，用于列表展示)
     */
    private BigDecimal lowestPrice;

    // 兼容旧字段名：有些服务/DTO 使用 departurePlace/destination
    public String getDeparturePlace() {
        return this.departureCity;
    }

    public String getDestination() {
        return this.arrivalCity;
    }
}