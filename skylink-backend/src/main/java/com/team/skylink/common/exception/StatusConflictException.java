package com.team.skylink.common.exception;

/**
 * 状态冲突异常
 */
public class StatusConflictException extends RuntimeException {
    public StatusConflictException(String message) {
        super(message);
    }
}
