package com.team.skylink.module.booking.service;

import com.team.skylink.common.Result;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper;
import com.team.skylink.module.booking.dto.BookingRequest;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.entity.Seat;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.flight.mapper.RouteMapper;
import com.team.skylink.module.flight.service.SeatService;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.order.service.PriceStrategyService;
import com.team.skylink.module.user.mapper.UserMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

public class BookingServiceImplTest {
    @Test
    void redEyePricingIncludesLastMinuteAndRedEyeDiscount() {
        OrderMapper orderMapper = mock(OrderMapper.class);
        FlightMapper flightMapper = mock(FlightMapper.class);
        AircraftCabinConfigMapper configMapper = mock(AircraftCabinConfigMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        RouteMapper routeMapper = mock(RouteMapper.class);
        SeatService seatService = mock(SeatService.class);

        PriceStrategyService priceStrategyService = new PriceStrategyService(seatService);

        BookingServiceImpl bookingService = new BookingServiceImpl(
                orderMapper, flightMapper, configMapper, userMapper, routeMapper, seatService, priceStrategyService);

        Flight flight = new Flight();
        flight.setFlightId(1L);
        flight.setRouteId(100L);
        flight.setFlightNo("MU1001");
        flight.setDepartureCity("A");
        flight.setArrivalCity("B");
        flight.setAirlineCompany("MU");
        flight.setDepartureTime(LocalDateTime.now().plusDays(2).withHour(23).withMinute(0).withSecond(0).withNano(0));
        when(flightMapper.selectById(1L)).thenReturn(flight);

        AircraftCabinConfig cfg = new AircraftCabinConfig();
        cfg.setConfigId(10L);
        cfg.setCabinType("ECONOMY");
        cfg.setCabinCoefficient(new BigDecimal("1.00"));
        cfg.setCapacity(null);
        when(configMapper.selectById(10L)).thenReturn(cfg);

        Route route = new Route();
        route.setRouteId(100L);
        route.setBasePrice(new BigDecimal("1000"));
        when(routeMapper.selectById(100L)).thenReturn(route);

        when(orderMapper.selectCount(any())).thenReturn(1L);

        Seat s = new Seat();
        s.setSeatId(5001L);
        when(seatService.lockSeats(1L, "ECONOMY", 1, 999L)).thenReturn(List.of(s));
        doNothing().when(seatService).associateOrder(anyLong(), anyList(), anyLong());
        when(seatService.getAvailableCount(1L, "ECONOMY")).thenReturn(10);

        BookingRequest req = new BookingRequest();
        req.setUserId(999L);
        req.setFlightIds(List.of("1"));
        req.setCabinId(10L);
        BookingRequest.PassengerInfo pi = new BookingRequest.PassengerInfo();
        pi.setName("Alice");
        pi.setIdCard("ID123");
        pi.setPhone("13800000000");
        req.setPassengers(Collections.singletonList(pi));
        req.setIsInterline(false);

        Result<Map<String, Object>> res = bookingService.submitBooking(req);
        ArgumentCaptor<Orders> captor = ArgumentCaptor.forClass(Orders.class);
        verify(orderMapper, atLeastOnce()).insert(captor.capture());
        Orders inserted = captor.getValue();

        BigDecimal expected = new BigDecimal("1020.00");
        assertEquals(0, inserted.getTotalAmount().compareTo(expected));
        assertEquals(1, inserted.getOrderStatus().intValue());
    }
}
