package com.team.skylink.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("system_config")
public class SystemConfig {
    @TableId(value = "config_id", type = IdType.AUTO)
    private Long configId;

    private String configName;
    private String configValue;
    private String configDesc;
    private LocalDateTime effectiveTime;
    private Long operAdminId;
    private LocalDateTime updateTime;
}

