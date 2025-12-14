package com.team.skylink.domain.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("refund_requests")
public class RefundRequest {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
}

