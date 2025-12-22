package com.team.skylink.common.exception;

/**
 * 物理座位选座并发冲突异常
 */
public class SeatOccupiedException extends RuntimeException {
    public SeatOccupiedException(String message) {
        super(message);
    }
}
