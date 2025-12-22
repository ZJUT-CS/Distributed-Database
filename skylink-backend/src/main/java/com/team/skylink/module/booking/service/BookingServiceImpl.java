package com.team.skylink.module.booking.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.team.skylink.common.Result;
import com.team.skylink.common.enums.TripTypeEnum;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig; // 替换
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper; // 替换
import com.team.skylink.module.booking.dto.BookingFlightDto;
import com.team.skylink.module.booking.dto.BookingRequest;
import com.team.skylink.module.booking.dto.BookingResponse;
import com.team.skylink.module.booking.service.BookingService;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.user.entity.User;
import com.team.skylink.module.user.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class BookingServiceImpl implements BookingService {

    private final OrderMapper orderMapper;
    private final FlightMapper flightMapper;
    private final AircraftCabinConfigMapper configMapper; // 替换
    private final UserMapper userMapper;

    public BookingServiceImpl(OrderMapper orderMapper, FlightMapper flightMapper, 
                              AircraftCabinConfigMapper configMapper, UserMapper userMapper) {
        this.orderMapper = orderMapper;
        this.flightMapper = flightMapper;
        this.configMapper = configMapper;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> submitBooking(BookingRequest req) {
        if (req.getFlightIds() == null || req.getFlightIds().isEmpty()) {
            return Result.fail(400, "请至少选择一个航班");
        }

        boolean isInterline = Boolean.TRUE.equals(req.getIsInterline()) && req.getFlightIds().size() > 1;

        if (isInterline) {
            createInterlineOrders(req);
        } else {
            createIndependentOrders(req);
        }
        return Result.ok(true);
    }

    private void createInterlineOrders(BookingRequest req) {
        long parentOrderId = IdWorker.getId();
        List<Long> flightIds = req.getFlightIds();
        for (int i = 0; i < flightIds.size(); i++) {
            saveSingleOrder(req.getUserId(), flightIds.get(i), parentOrderId,
                    i == 0 ? TripTypeEnum.INTERLINE_FIRST.getCode() : TripTypeEnum.INTERLINE_NEXT.getCode());
        }
    }

    private void createIndependentOrders(BookingRequest req) {
        for (Long flightId : req.getFlightIds()) {
            saveSingleOrder(req.getUserId(), flightId, null, TripTypeEnum.INDEPENDENT.getCode());
        }
    }

    private void saveSingleOrder(Long userId, Long flightId, Long parentOrderId, Integer tripType) {
        Flight flight = flightMapper.selectById(flightId);
        Orders order = new Orders();
        order.setUserId(userId);
        order.setFlightId(flightId);
        order.setTotalAmount(flight.getLowestPrice()); // 默认最低价
        order.setOrderStatus(0); // 待审核
        order.setParentOrderId(parentOrderId);
        order.setTripType(tripType);
        order.setOrderTime(LocalDateTime.now());
        orderMapper.insert(order);
    }

    @Override
    public List<BookingResponse> listBookings(Long userId) {
        List<Orders> orders = orderMapper.selectList(new QueryWrapper<Orders>()
                .eq("user_id", userId).orderByDesc("order_time"));
        
        User user = userMapper.selectById(userId);
        List<BookingResponse> resp = new ArrayList<>();

        for (Orders o : orders) {
            Flight f = flightMapper.selectById(o.getFlightId());
            // 订单中的 cabinId 对应 aircraft_cabin_configs 的 configId
            AircraftCabinConfig c = (o.getCabinId() != null) ? configMapper.selectById(o.getCabinId()) : null;

            BookingFlightDto flightDto = mapFlight(f, c);

            BookingResponse r = new BookingResponse();
            r.setId(String.valueOf(o.getOrderId()));
            r.setPassengerName(user != null ? user.getRealName() : String.valueOf(userId));
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
        if (status == null) return "unknown";
        return switch (status) {
            case 0 -> "pending_audit";
            case 1 -> "pending_payment";
            case 2 -> "confirmed";
            case 3 -> "rejected";
            case 4 -> "refunding";
            case 5 -> "refunded";
            case 6 -> "cancelled";
            default -> "confirmed";
        };
    }

    private static BookingFlightDto mapFlight(Flight f, AircraftCabinConfig c) {
        if (f == null) return null;
        BookingFlightDto dto = new BookingFlightDto();
        dto.setId(f.getFlightNo());
        dto.setFlightNumber(f.getFlightNo());
        dto.setOrigin(f.getDeparturePlace());
        dto.setDestination(f.getDestination());
        dto.setDepartureTime(f.getDepartureTime());
        dto.setArrivalTime(f.getArrivalTime());

        if (c != null) {
            // 动态计算：基准价 * 舱位系数
            BigDecimal price = f.getLowestPrice().multiply(c.getCabinCoefficient());
            dto.setPrice(price);
            dto.setCabinType(c.getCabinType());
        } else {
            dto.setPrice(f.getLowestPrice());
        }

        if (f.getDepartureTime() != null && f.getArrivalTime() != null) {
            Duration d = Duration.between(f.getDepartureTime(), f.getArrivalTime());
            dto.setDuration(d.toHours() + "小时 " + (d.toMinutes() % 60) + "分");
        }
        return dto;
    }

    private static String toAirlineCode(String flightNo) {
        if (flightNo == null || flightNo.isBlank()) return "";
        return flightNo.replaceAll("[^A-Z]", "");
    }
}