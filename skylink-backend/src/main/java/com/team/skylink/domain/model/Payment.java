package com.team.skylink.domain.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("payments")
public class Payment {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
}

