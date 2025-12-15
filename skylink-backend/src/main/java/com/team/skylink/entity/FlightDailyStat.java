package com.team.skylink.entity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@TableName("flight_daily_stats")
public class FlightDailyStat {
    @TableId(value = "stat_date", type = IdType.ASSIGN_ID) // 复合主键1:统计日期
    private LocalDate statDate;
    private Long flightId;
    private Integer totalSeats; // 总座位数
    private Integer soldSeats; // 已售座位数
    private BigDecimal totalRevenue; // 总收入
    private Long updateTime; // 更新时间戳
}
