package com.team.skylink.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;

@Data
@TableName("seats")
public class Seat {
    @TableId(value = "seat_id", type = IdType.ASSIGN_ID) // 雪花算法生成
    private Long seatId;

    private Long flightId; // 航班ID(分片键)
    private String seatNumber; // 座位号
    private Integer seatClass; // 舱位:1-经济舱,2-商务舱,3-头等舱
    private Integer seatStatus; // 状态:1-可用,2-已售,3-锁定
    private BigDecimal price; // 价格
    private Long createTime; // 创建时间戳
}