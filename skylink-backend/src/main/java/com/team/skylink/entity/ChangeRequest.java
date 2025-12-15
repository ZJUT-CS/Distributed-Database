package com.team.skylink.entity;


import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;

@Data
@TableName("change_requests")
public class ChangeRequest {
    @TableId(value = "request_id", type = IdType.ASSIGN_ID) // 雪花算法生成
    private Long requestId;

    private Long originalOrderId; // 原订单ID(分片键)
    private Long newFlightId; // 新航班ID
    private Long newSeatId; // 新座位ID
    private BigDecimal changeFee; // 改签费用
    private Integer requestStatus; // 状态
    private Long createTime; // 申请时间戳
}

