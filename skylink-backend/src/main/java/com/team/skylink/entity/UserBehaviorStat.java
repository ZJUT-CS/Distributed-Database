package com.team.skylink.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("user_behavior_stats")
public class UserBehaviorStat {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
}

