package com.team.skylink.module.booking.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.module.auth.entity.User;
import com.team.skylink.module.auth.mapper.UserMapper;
import com.team.skylink.module.booking.dto.BookingFlightDto;
import com.team.skylink.module.booking.dto.BookingResponse;
import com.team.skylink.module.flight.entity.Cabin;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.mapper.CabinMapper;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.order.entity.Order;
import com.team.skylink.module.order.mapper.OrderMapper;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class BookingServiceImpl implements BookingService {
    private final OrderMapper orderMapper;
    private final FlightMapper flightMapper;
    private final CabinMapper cabinMapper;
    private final UserMapper userMapper;

    public BookingServiceImpl(OrderMapper orderMapper, FlightMapper flightMapper, CabinMapper cabinMapper, UserMapper userMapper) {
        this.orderMapper = orderMapper;
        this.flightMapper = flightMapper;
        this.cabinMapper = cabinMapper;
        this.userMapper = userMapper;
    }

    @Override
    public List<BookingResponse> listBookings(Long userId) {
        List<Order> orders = orderMapper.selectList(new QueryWrapper<Order>().eq("user_id", userId));
        if (orders == null || orders.isEmpty()) {
            return new ArrayList<>();
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

        return resp;
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

