package com.team.skylink.module.refund.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("refund_change_record")
public class RefundChangeRecord {
    @TableId(value = "record_id", type = IdType.AUTO)
    private Long recordId;

    private Long orderId;
    private Integer operType;
    private Long oldFlightId;
    private Long newFlightId;
    private Long oldCabinId;
    private Long newCabinId;
    private Long operUserId;
    private Integer operUserType;
    private Integer auditStatus;
    private LocalDateTime operTime;
    private LocalDateTime auditTime;
    private Long auditAdminId;
    private String remark;
}

