package com.team.skylink.entity;


import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;

@Data
@TableName("payments")
public class Payment {
    @TableId(value = "payment_id", type = IdType.ASSIGN_ID) // 雪花算法生成
    private Long paymentId;

    private Long orderId; // 订单ID(分片键)
    private String paymentNumber; // 支付流水号
    private Integer paymentMethod; // 方式:1-支付宝,2-微信
    private BigDecimal paymentAmount; // 支付金额
    private Integer paymentStatus; // 状态
    private String transactionId; // 第三方交易ID
    private Long paymentTime; // 支付时间戳
    private Long createTime; // 创建时间戳
}
