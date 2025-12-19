package com.team.skylink.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@TableName("user_behavior_stats")
public class UserBehaviorStat {
    @TableId(value = "user_id", type = IdType.ASSIGN_ID) // 复合主键1:用户ID(分片键)
    private Long userId;

    private LocalDate statDate;

    private Integer loginCount; // 登录次数
    private Integer orderCount; // 下单次数
    private BigDecimal totalSpent; // 总消费
    private Long updateTime; // 更新时间戳
}
