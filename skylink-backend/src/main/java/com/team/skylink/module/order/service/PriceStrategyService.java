package com.team.skylink.module.order.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.flight.service.SeatService;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class PriceStrategyService {

    private final SeatService seatService;
    private final OrderMapper orderMapper;

    public PriceStrategyService(SeatService seatService, OrderMapper orderMapper) {
        this.seatService = seatService;
        this.orderMapper = orderMapper;
    }

    /**
     * Calculate price based on L1, L2, L3 strategies (per flight)
     *
     * @param flight     Flight entity
     * @param route      Route entity
     * @param config     Cabin config
     * @param isInterline Whether it is an interline flight (L2)
     * @param userId     User ID (nullable). If provided, applies L4 User Discount.
     * @return Price after L1-L4
     */
    public BigDecimal calculateSegmentPrice(Flight flight, Route route, AircraftCabinConfig config, boolean isInterline, Long userId) {
        // L1: Base Price Layer
        BigDecimal basePrice = route.getBasePrice();
        if (config.getCabinCoefficient() != null) {
            basePrice = basePrice.multiply(config.getCabinCoefficient());
        }
        BigDecimal price = basePrice;

        // L2: Bundle Layer (Interline Discount) - Moved to applyInterlineDiscount for proper handling
        // Interline discount is now applied at the total price level, not per segment

        // L3: Dynamic Layer
        BigDecimal dynamicMultiplier = BigDecimal.ONE;

        // 1. Time-based
        long daysBefore = Duration.between(LocalDateTime.now(), flight.getDepartureTime()).toDays();
        if (daysBefore > 30) {
            dynamicMultiplier = dynamicMultiplier.multiply(new BigDecimal("0.90")); // Early bird
        } else if (daysBefore < 3) {
            dynamicMultiplier = dynamicMultiplier.multiply(new BigDecimal("1.20")); // Last minute
        }
        // 3-30 days: 1.0 (no change)

        // 2. Red-eye (23:00 - 06:00)
        int hour = flight.getDepartureTime().getHour();
        if (hour >= 23 || hour < 6) {
            dynamicMultiplier = dynamicMultiplier.multiply(new BigDecimal("0.85"));
        }

        // 3. Scarcity
        if (config.getCapacity() != null && config.getCapacity() > 0) {
            Integer available = seatService.getAvailableCount(flight.getFlightId(), config.getCabinType());
            double ratio = (double) available / config.getCapacity();
            
            if (ratio < 0.20) {
                dynamicMultiplier = dynamicMultiplier.multiply(new BigDecimal("1.15")); // Scarcity
            } else if (ratio > 0.80) {
                dynamicMultiplier = dynamicMultiplier.multiply(new BigDecimal("0.95")); // Surplus
            }
        }
        
        // Applying dynamic multiplier
        price = price.multiply(dynamicMultiplier);

        // L4: User Discount (New User)
        if (userId != null) {
            Long count = orderMapper.selectCount(new QueryWrapper<Orders>().eq("user_id", userId));
            if (count != null && count == 0) {
                price = price.multiply(new BigDecimal("0.90")); // 9折
            }
        }

        // Rounding (2 decimal places)
        return price.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    /**
     * Apply L2 Interline Discount (Once per interline order total)
     * @param totalPrice Total price of the interline order (sum of all segments)
     * @return Final price after interline discount
     */
    public BigDecimal applyInterlineDiscount(BigDecimal totalPrice) {
        totalPrice = totalPrice.multiply(new BigDecimal("0.90"));
        return totalPrice.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    /**
     * Apply L4 User Discount (Once per order)
     * @param totalPrice Total price of the order (sum of segments)
     * @param isNewUser Whether user is new
     * @return Final price
     */
    public BigDecimal applyUserDiscount(BigDecimal totalPrice, boolean isNewUser) {
        if (isNewUser) {
            totalPrice = totalPrice.multiply(new BigDecimal("0.90"));
        }
        return totalPrice.setScale(2, java.math.RoundingMode.HALF_UP);
    }
}
