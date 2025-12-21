package com.team.skylink.module.refund.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 退票/改签操作记录表实体
 */
@Data
@TableName("refund_change_record")
public class RefundChangeRecord {
    /**
     * 记录ID，主键(雪花算法生成)
     */
    @TableId(value = "record_id", type = IdType.ASSIGN_ID)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long recordId;

    /**
     * 关联机票订单ID
     */
    private Long orderId;

    /**
     * 操作类型：1-退票，2-改签
     */
    private Integer operType;

    /**
     * 原航班ID
     */
    private Long oldFlightId;

    /**
     * 新航班ID（改签用，退票为NULL）
     */
    private Long newFlightId;

    /**
     * 原舱位ID
     */
    private Long oldCabinId;

    /**
     * 新舱位ID（改签用，退票为NULL）
     */
    private Long newCabinId;

    /**
     * 操作人ID（用户ID/管理员ID）
     */
    private Long operUserId;

    /**
     * 操作人类型：1-用户，2-管理员
     */
    private Integer operUserType;

    /**
     * 审核状态：0-待审核，1-审核通过，2-审核拒绝
     */
    private Integer auditStatus;

    /**
     * 操作发起时间
     */
    private LocalDateTime operTime;

    /**
     * 审核完成时间
     */
    private LocalDateTime auditTime;

    /**
     * 审核管理员ID
     */
    private Long auditAdminId;

    /**
     * 操作/审核备注
     */
    private String remark;
}

