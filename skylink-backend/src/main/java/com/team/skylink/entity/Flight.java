package com.team.skylink.entity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;

@Data
@TableName("flights")
public class Flight {
    @TableId(value = "flight_id", type = IdType.ASSIGN_ID) // 雪花算法生成
    private Long flightId;

    private String flightNumber; // 航班号
    private String airline; // 航空公司
    private String departureCity; // 出发城市
    private String departureAirport; // 出发机场
    private String arrivalCity; // 到达城市
    private String arrivalAirport; // 到达机场
    private Long departureTime; // 起飞时间戳
    private Long arrivalTime; // 到达时间戳
    private Integer flightDuration; // 飞行时长(分钟)
    private String aircraftType; // 机型
    private Integer totalSeats; // 总座位数
    private Integer availableSeats; // 可用座位数
    private BigDecimal economyPrice; // 经济舱价格
    private BigDecimal businessPrice; // 商务舱价格
    private BigDecimal firstClassPrice; // 头等舱价格
    private Integer flightStatus; // 状态:1-计划中...6-已到达
    private Long createTime; // 创建时间戳
    private Long updateTime; // 更新时间戳
}