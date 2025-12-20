package com.team.skylink.module.admin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("admins")
public class Admin {
    /**
     * 后端标识(雪花算法)
     */
    @TableId(value = "admin_id", type = IdType.ASSIGN_ID)
    private Long adminId;

    /**
     * 管理员账号 (对应 SQL 中的 admin_account)
     */
    private String adminAccount;

    /**
     * 加密密码
     */
    private String passwordHash;

    /**
     * 角色 (默认是普通管理员)
     */
    private Integer role;

    /**
     * 最后登录时间
     */
    private Long lastLoginTime;

    /**
     * 创建时间戳
     */
    private Long createTime;
}

