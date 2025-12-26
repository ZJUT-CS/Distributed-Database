package com.team.skylink.module.flight.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
public class FlightCreateRequest {
    @NotBlank(message = "航班号不能为空")
    private String flightNo;

    // --- 核心关联ID (必填) ---
    @NotNull(message = "机型ID不能为空")
    private Long modelId;

    @NotNull(message = "航线ID不能为空")
    private Long routeId;

    // --- 时间信息 ---
    @NotNull(message = "起飞时间不能为空")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime departureTime;

    // 到达时间：非必填，后端自动根据航线时长计算
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime arrivalTime;

    // --- 以下字段均改为非必填 (由 Service 自动填充) ---
    private String departureCity;
    private String departureAirport;
    private String arrivalCity;
    private String arrivalAirport;
    
    // 如果不填，默认使用机型总座位数
    private Integer totalSeats; 

    @NotBlank(message = "航空公司不能为空")
    private String airlineCompany;

    // 默认布局方案 1
    private Integer layoutNo = 1;

    private String stopoverInfo;

    // 默认状态 1-计划中
    private Integer status = 1;
}