package com.team.skylink.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("users")
public class User {
    @TableId(value = "user_id", type = IdType.ASSIGN_ID) // 雪花算法生成
    private Long userId;

    private String phoneNumber; // 手机号(唯一)
    private String passwordHash; // 加密密码
    private String realName; // 真实姓名
    private String email; // 邮箱
    private String avatarUrl; // 头像URL
    private String idCard; // 身份证号
    private Integer gender; // 性别:0-未知,1-男,2-女
    private Integer userStatus; // 状态:1-正常,2-锁定,3-注销
    private LocalDateTime createTime; // 注册时间
}
