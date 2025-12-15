package com.team.skylink.entity;


import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;

@Data
@TableName("orders")
public class Order {
    @TableId(value = "order_id", type = IdType.ASSIGN_ID) // 雪花算法生成
    private Long orderId;

    private String orderNumber; // 业务订单号
    private Long userId; // 用户ID(分片键)
    private Long flightId; // 航班ID
    private Long seatId; // 座位ID
    private String passengerName; // 乘客姓名
    private String passengerIdCard; // 乘客身份证
    private Integer seatClass; // 舱位等级
    private BigDecimal actualAmount; // 实际支付金额
    private Integer orderStatus; // 状态:1-待支付...7-已完成
    private Long createTime; // 创建时间戳
    private Long payTime; // 支付时间戳
    private Long cancelTime; // 取消时间戳
}