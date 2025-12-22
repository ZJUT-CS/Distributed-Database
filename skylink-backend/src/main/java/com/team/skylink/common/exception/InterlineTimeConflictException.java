package com.team.skylink.common.exception;

/**
 * 联程航班时间冲突异常
 * 当中转时间不足或过长时抛出
 */
public class InterlineTimeConflictException extends RuntimeException {
    public InterlineTimeConflictException(String message) {
        super(message);
    }
}
