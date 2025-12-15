package com.team.skylink.entity;


import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("operation_logs")
public class OperationLog {
    @TableId(value = "log_id", type = IdType.ASSIGN_ID) // 雪花算法生成(分片键)
    private Long logId;

    private Integer logType; // 类型:1-操作,2-登录
    private Long operatorId; // 操作人ID
    private Integer operatorType; // 类型:1-用户,2-管理员
    private String operation; // 操作名称
    private String operationDetail; // 详情(JSON)
    private String ipAddress; // IP地址
    private Long operationTime; // 操作时间戳
}
