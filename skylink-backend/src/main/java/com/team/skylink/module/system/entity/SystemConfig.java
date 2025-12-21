package com.team.skylink.module.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 系统配置表实体
 */
@Data
@TableName("system_config")
public class SystemConfig {
    /**
     * 配置ID，主键(雪花算法生成)
     */
    @TableId(value = "config_id", type = IdType.ASSIGN_ID)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long configId;

    /**
     * 配置项名称（唯一，如payment_timeout/flight_cache_ttl）
     */
    private String configName;

    /**
     * 配置项值（如1800/3600）
     */
    private String configValue;

    /**
     * 配置项描述（如支付超时时间/航班缓存过期时间）
     */
    private String configDesc;

    /**
     * 配置生效时间
     */
    private LocalDateTime effectiveTime;

    /**
     * 操作管理员ID
     */
    private Long operAdminId;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}

