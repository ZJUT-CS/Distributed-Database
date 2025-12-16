package com.team.skylink.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("orders")
public class Order {
    @TableId(value = "order_id", type = IdType.AUTO)
    private Long orderId;

    private Long userId;
    private Long flightId;
    private Long cabinId;
    private Integer orderStatus;
    private Integer ticketNum;
    private BigDecimal totalAmount;
    private LocalDateTime orderTime;
    private LocalDateTime payTime;
    private LocalDateTime refundTime;
    private LocalDateTime changeTime;
}

