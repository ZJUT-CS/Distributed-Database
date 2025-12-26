package com.team.skylink.module.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 系统操作日志表实体
 */
@Data
@TableName("system_log")
public class SystemLog {
    /**
     * 日志ID，主键(雪花算法生成)
     */
    @TableId(value = "log_id", type = IdType.ASSIGN_ID)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long logId;

    /**
     * 操作人类型：1-用户，2-管理员
     */
    private Integer operUserType;

    /**
     * 操作人ID（用户ID/管理员ID）
     */
    private Long operUserId;

    /**
     * 操作模块：flight-航班管理，order-订单管理，user-用户管理，payment-支付管理，config-系统配置
     */
    private String operModule;

    /**
     * 操作类型：query-查询，add-添加，update-修改，delete-删除，login-登录，audit-审核
     */
    private String operType;

    /**
     * 操作内容（如"修改航班CA1234出发时间为2025-12-20 08:00"）
     */
    private String operContent;

    /**
     * 操作IP地址
     */
    private String operIp;

    /**
     * 操作结果：1-成功，0-失败
     */
    private Integer operResult;

    /**
     * 操作时间
     */
    private LocalDateTime operTime;
}

