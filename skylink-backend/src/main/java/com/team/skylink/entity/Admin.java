package com.team.skylink.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("admins")
public class Admin {
    @TableId(value = "admin_id", type = IdType.ASSIGN_ID) // 雪花算法生成
    private Long adminId;

    private String username; // 用户名(唯一)
    private String passwordHash; // 加密密码
    private Integer role; // 角色
    private Long lastLoginTime; // 最后登录时间
    private Long createTime; // 创建时间戳
}

