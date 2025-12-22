package com.team.skylink.common.exception;

/**
 * 部分预订成功异常
 * 当联程航班中仅部分航段预订成功时抛出，通常需要触发补偿机制
 */
public class PartialBookingException extends RuntimeException {
    public PartialBookingException(String message) {
        super(message);
    }
}
