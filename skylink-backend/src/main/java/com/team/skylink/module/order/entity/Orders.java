package com.team.skylink.module.order.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("orders")
public class Orders {
    
    @TableId(value = "order_id", type = IdType.ASSIGN_ID)
    private Long orderId;

    private Long userId;
    private Long flightId;
    private Long cabinId;
    private Integer orderStatus;
    private Integer ticketNum;
    private BigDecimal totalAmount;
    private String passengerName;
    private String contactEmail;
    private String contactPhone;
    private String passengersJson;
    
    private LocalDateTime orderTime;
    private LocalDateTime payTime;
    private LocalDateTime refundTime;
    private LocalDateTime changeTime;

    // --- 系统审计字段 ---
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    // --- 联程新增字段 ---
    private Long parentOrderId;
    private Integer tripType;
    private String flightSnapshot;

    // --- 手动添加 Getter/Setter 以防 Lombok 失效 ---
    
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }

    public LocalDateTime getUpdateTime() { return updateTime; }
    public void setUpdateTime(LocalDateTime updateTime) { this.updateTime = updateTime; }
    
    public Integer getOrderStatus() { return orderStatus; }
    public void setOrderStatus(Integer orderStatus) { this.orderStatus = orderStatus; }
    
    public Long getParentOrderId() { return parentOrderId; }
    public void setParentOrderId(Long parentOrderId) { this.parentOrderId = parentOrderId; }
}