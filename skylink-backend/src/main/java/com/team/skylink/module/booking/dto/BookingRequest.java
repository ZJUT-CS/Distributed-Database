package com.team.skylink.module.booking.dto;

import lombok.Data;
import java.util.List;

@Data
public class BookingRequest {
    /**
     * 航班ID列表
     * 单程: [1001]
     * 联程/多程: [1001, 1002]
     */
    private List<Long> flightIds; 
    
    // 乘客ID列表
    private List<Long> passengerIds; 
    
    // 当前用户ID (如果集成了登录，这个可能从Token获取，这里先模拟)
    private Long userId;

    /**
     * 【核心开关】是否为联程票？
     * true = 打包 (生成父子单)
     * false = 拼凑 (生成独立单)
     */
    private Boolean isInterline; 
}