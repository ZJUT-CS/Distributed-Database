package com.team.skylink.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("system_log")
public class SystemLog {
    @TableId(value = "log_id", type = IdType.AUTO)
    private Long logId;

    private Integer operUserType;
    private Long operUserId;
    private String operModule;
    private String operType;
    private String operContent;
    private String operIp;
    private Integer operResult;
    private LocalDateTime operTime;
}

