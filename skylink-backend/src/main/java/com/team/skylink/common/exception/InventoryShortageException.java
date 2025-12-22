package com.team.skylink.common.exception;

/**
 * 动态库存不足异常
 */
public class InventoryShortageException extends RuntimeException {
    public InventoryShortageException(String message) {
        super(message);
    }
}
