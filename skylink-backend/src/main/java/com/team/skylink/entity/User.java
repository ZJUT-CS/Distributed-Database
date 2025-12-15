package com.team.skylink.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("users")
public class User {
    @TableId(value = "user_id", type = IdType.AUTO)
    private Long userId;
    private String phoneNumber;
    private String passwordHash;
    private String realName;
    private String email;
    private String idCard;
    private Integer gender;
    private java.sql.Date birthDate;
    private Integer userStatus;
    private Long registerTime;
    private Long lastLoginTime;
}

