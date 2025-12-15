package com.team.skylink.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("configs")
public class Config {
    @TableId(value = "config_key") // 主键:配置键
    private String configKey;

    private String configValue; // 配置值
    private String description; // 描述
    private Long updateTime; // 更新时间戳
}

