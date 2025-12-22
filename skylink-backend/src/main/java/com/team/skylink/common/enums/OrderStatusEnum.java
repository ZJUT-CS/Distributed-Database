package com.team.skylink.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 订单状态枚举
 */
@Getter
@AllArgsConstructor
public enum OrderStatusEnum {
    PENDING_AUDIT(0, "待审核"),
    PENDING_PAYMENT(1, "待支付"),
    CONFIRMED(2, "已支付"),
    REJECTED(3, "已拒绝"),
    PROCESSING(4, "改签处理中"),
    REFUNDED(5, "已退票"),
    CANCELLED(6, "已取消");

    private final int code;
    private final String desc;
}
