package com.team.skylink.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("flights")
public class Flight {
    @TableId(value = "flight_id", type = IdType.AUTO)
    private Long flightId;

    private String flightNo;
    private String departurePlace;
    private String destination;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private String airlineCompany;
    private Integer totalSeats;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}

