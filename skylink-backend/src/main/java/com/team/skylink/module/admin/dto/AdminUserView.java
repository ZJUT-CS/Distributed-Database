package com.team.skylink.module.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminUserView {
    private Long userId;
    private String phoneNumber;
    private String realName;
    private String email;
    private String avatarUrl;
    private Integer gender;
    private Integer userStatus;
    private LocalDateTime createTime;

    /**
     * 身份证号脱敏值（仅用于展示），不返回明文
     */
    private String idCardMasked;

    /**
     * 是否已实名/已绑定证件
     */
    private Boolean idCardPresent;
}
