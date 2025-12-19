package com.team.skylink.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.dto.BookingFlightDto;
import com.team.skylink.dto.BookingResponse;
import com.team.skylink.entity.Cabin;
import com.team.skylink.entity.Flight;
import com.team.skylink.entity.Order;
import com.team.skylink.entity.User;
import com.team.skylink.mapper.CabinMapper;
import com.team.skylink.mapper.FlightMapper;
import com.team.skylink.mapper.OrderMapper;
import com.team.skylink.mapper.UserMapper;
import jakarta.validation.constraints.NotNull;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Validated
@RestController
@RequestMapping({"/api/v1/bookings"})
public class BookingController {
    private final OrderMapper orderMapper;
    private final FlightMapper flightMapper;
    private final CabinMapper cabinMapper;
    private final UserMapper userMapper;

    public BookingController(OrderMapper orderMapper, FlightMapper flightMapper, CabinMapper cabinMapper, UserMapper userMapper) {
        this.orderMapper = orderMapper;
        this.flightMapper = flightMapper;
        this.cabinMapper = cabinMapper;
        this.userMapper = userMapper;
    }

    @GetMapping
    public Result<List<BookingResponse>> listBookings(@RequestParam @NotNull(message = "userId is required") Long userId) {
        List<Order> orders = orderMapper.selectList(new QueryWrapper<Order>().eq("user_id", userId));
        if (orders == null || orders.isEmpty()) {
            return Result.ok(new ArrayList<>());
        }

        User user = userMapper.selectById(userId);

        List<BookingResponse> resp = new ArrayList<>();
        for (Order o : orders) {
            Flight f = flightMapper.selectById(o.getFlightId());
            Cabin c = cabinMapper.selectById(o.getCabinId());

            BookingFlightDto flightDto = mapFlight(f, c);

            BookingResponse r = new BookingResponse();
            r.setId(String.valueOf(o.getOrderId()));
            r.setPassengerName(user != null && user.getRealName() != null ? user.getRealName() : String.valueOf(userId));
            r.setPassportNumber("******");
            r.setContactEmail(user != null ? user.getEmail() : null);
            r.setPhone(user != null ? user.getPhoneNumber() : null);
            r.setCabinClass("economy");
            r.setTotalPrice(o.getTotalAmount());
            r.setBookingDate(o.getOrderTime());
            r.setStatus(mapOrderStatus(o.getOrderStatus()));
            r.setFlight(flightDto);
            r.setFlights(flightDto != null ? List.of(flightDto) : List.of());
            resp.add(r);
        }

        return Result.ok(resp);
    }

    private static String mapOrderStatus(Integer status) {
        if (status == null) return "pending_payment";
        return switch (status) {
            case 0 -> "pending_payment";
            case 1 -> "confirmed";
            case 2 -> "cancelled";
            case 3 -> "refunded";
            case 4 -> "refunding";
            case 5 -> "changed";
            default -> "confirmed";
        };
    }

    private static BookingFlightDto mapFlight(Flight f, Cabin c) {
        if (f == null) return null;

        BookingFlightDto dto = new BookingFlightDto();
        dto.setId(f.getFlightNo());
        dto.setAirline(f.getAirlineCompany() != null ? f.getAirlineCompany() : "");
        dto.setAirlineCode(toAirlineCode(f.getFlightNo()));
        dto.setFlightNumber(f.getFlightNo());
        dto.setCabinType(c != null ? c.getCabinType() : null);
        dto.setOrigin(f.getDeparturePlace());
        dto.setDestination(f.getDestination());
        dto.setDepartureTime(f.getDepartureTime());
        dto.setArrivalTime(f.getArrivalTime());

        if (c != null) {
            dto.setPrice(c.getPrice());
            dto.setRemainingSeats(c.getRemainingSeats());
        }

        if (f.getDepartureTime() != null && f.getArrivalTime() != null) {
            Duration d = Duration.between(f.getDepartureTime(), f.getArrivalTime());
            long hours = d.toHours();
            long minutes = d.toMinutes() % 60;
            dto.setDuration(hours + "小时 " + minutes + "分");
        } else {
            dto.setDuration("");
        }

        dto.setStops(0);
        dto.setBaggageWeight(23);

        BookingFlightDto.Amenities amenities = new BookingFlightDto.Amenities();
        amenities.setHasPower(false);
        amenities.setHasMeal(true);
        amenities.setHasWifi(false);
        amenities.setHasEntertainment(false);
        dto.setAmenities(amenities);

        return dto;
    }

    private static String toAirlineCode(String flightNo) {
        if (flightNo == null || flightNo.isBlank()) return "";
        String letters = flightNo.replaceAll("[^A-Z]", "");
        if (letters.isBlank()) return "";
        return letters.length() >= 2 ? letters.substring(0, 2) : letters;
    }
}
