package com.team.skylink.module.payment.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("payments")
public class Payment {
    @TableId(value = "payment_id", type = IdType.AUTO)
    private Long paymentId;

    private Long orderId;
    private BigDecimal paymentAmount;
    private String paymentMethod;
    private Integer paymentStatus;
    private String tradeNo;
    private LocalDateTime paymentTime;
    private LocalDateTime refundTime;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}

