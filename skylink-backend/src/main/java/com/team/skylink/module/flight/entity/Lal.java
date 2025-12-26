package com.team.skylink.module.flight.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("LAL") // 必须与数据库表名完全一致
public class Lal {
    
    @TableId(value = "id", type = IdType.AUTO)
    private Integer id;

    private String airportCode; // 例如 "PEK"
    private String airportName; // 例如 "北京首都国际机场"
    private String city;
    private String country;

    // 经纬度建议用 BigDecimal 防止精度丢失
    private BigDecimal longitude; 
    private BigDecimal latitude;

    private String iataCode;
    private String icaoCode;

    private LocalDateTime createdAt;
}