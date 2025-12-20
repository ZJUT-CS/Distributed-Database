package com.team.skylink.module.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminOrderStatusRequest {
    @NotNull(message = "orderStatus is required")
    private Integer orderStatus;
}

