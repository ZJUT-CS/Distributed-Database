package com.team.skylink.module.payment.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 支付订单表实体
 */
@Data
@TableName("payments")
public class Payment {
    /**
     * 支付ID，主键(雪花算法生成)
     */
    @TableId(value = "payment_id", type = IdType.ASSIGN_ID)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long paymentId;

    /**
     * 关联机票订单ID（唯一）
     */
    private Long orderId;

    /**
     * 支付金额（元）
     */
    private BigDecimal paymentAmount;

    /**
     * 支付方式：wechat-微信，alipay-支付宝，card-银行卡
     */
    private String paymentMethod;

    /**
     * 支付状态：0-待支付，1-已支付，2-支付失败，3-退款中，4-已退款
     */
    private Integer paymentStatus;

    /**
     * 第三方交易流水号（唯一，如微信/支付宝单号）
     */
    private String tradeNo;

    /**
     * 支付完成时间
     */
    private LocalDateTime paymentTime;

    /**
     * 退款完成时间
     */
    private LocalDateTime refundTime;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}

