package com.team.skylink.common;

import com.team.skylink.common.exception.InventoryShortageException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.validation.ConstraintViolationException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldError() != null ?
                ex.getBindingResult().getFieldError().getDefaultMessage() : "validation error";
        return Result.fail(HttpStatus.BAD_REQUEST.value(), msg);
    }

    @ExceptionHandler(BindException.class)
    public Result<Void> handleBind(BindException ex) {
        String msg = ex.getBindingResult().getFieldError() != null ?
                ex.getBindingResult().getFieldError().getDefaultMessage() : "bind error";
        return Result.fail(HttpStatus.BAD_REQUEST.value(), msg);
    }

    @ExceptionHandler({
            ConstraintViolationException.class,
            MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class,
            HttpMessageNotReadableException.class
    })
    public Result<Void> handleBadRequest(Exception ex) {
        log.error("Bad Request details: ", ex);
        return Result.fail(HttpStatus.BAD_REQUEST.value(), "invalid request: " + ex.getMessage());
    }

    @ExceptionHandler(InventoryShortageException.class)
    public Result<Void> handleInventoryShortage(InventoryShortageException ex) {
        log.warn("Inventory shortage: {}", ex.getMessage());
        return Result.fail(HttpStatus.CONFLICT.value(), ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception ex) {
        log.error("Unhandled exception", ex);
        return Result.fail(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Internal Error: " + ex.getClass().getName() + " - " + ex.getMessage());
    }
}

