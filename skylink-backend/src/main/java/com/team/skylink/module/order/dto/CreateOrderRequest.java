package com.team.skylink.module.order.dto;

import lombok.Data;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class CreateOrderRequest {
    @NotNull(message = "userId is required")
    private Long userId;

    // flightId 为唯一标识；flightNo 仅用于展示/查询兼容，不再允许用于写入创建
    private Long flightId;

    private String flightNo;

    @NotBlank(message = "cabinType is required")
    private String cabinType;

    @NotNull(message = "ticketNum is required")
    @Min(value = 1, message = "ticketNum must be >= 1")
    private Integer ticketNum;

    @NotBlank(message = "passengerName is required")
    private String passengerName;

    private String contactEmail;
    private String contactPhone;
    private String passengersJson;
    
    // For interline flights
    private java.util.List<Long> flightIds;

    // 兼容字段（只读）：旧接口联程使用 flightNos（航班号），不再允许用于写入创建
    private java.util.List<String> flightNos;
    
    // For mixed cabin types in interline flights (Optional)
    // If provided, must match the size of flightNos
    private java.util.List<String> cabinTypes;

    @AssertTrue(message = "flightId or flightIds is required")
    public boolean isFlightIdentifierPresent() {
        if (flightId != null) {
            return true;
        }
        if (flightIds != null && !flightIds.isEmpty()) {
            return true;
        }
        return false;
    }
}

