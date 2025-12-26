package com.team.skylink.module.admin.dto;

import com.team.skylink.module.flight.entity.Flight;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
public class AdminFlightListVO extends Flight {
    /**
     * 客座率 (0.00 - 1.00)
     */
    private BigDecimal occupancyRate;

    private Integer soldCount;
}
