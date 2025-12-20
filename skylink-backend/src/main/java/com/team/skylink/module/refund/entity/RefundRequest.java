package com.team.skylink.module.refund.entity;


import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;

@Data
@TableName("refund_requests")
public class RefundRequest {
    @TableId(value = "request_id", type = IdType.ASSIGN_ID) // 雪花算法生成
    private Long requestId;

    private Long orderId; // 订单ID(分片键)
    private Long paymentId; // 支付记录ID
    private BigDecimal refundAmount; // 退款金额
    private String refundReason; // 退款原因
    private Integer requestStatus; // 状态
    private Long createTime; // 申请时间戳
}

