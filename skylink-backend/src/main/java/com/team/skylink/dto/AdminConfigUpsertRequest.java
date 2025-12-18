package com.team.skylink.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminConfigUpsertRequest {
    @NotBlank(message = "configName is required")
    private String configName;

    @NotBlank(message = "configValue is required")
    private String configValue;

    private String configDesc;

    private LocalDateTime effectiveTime;
}

