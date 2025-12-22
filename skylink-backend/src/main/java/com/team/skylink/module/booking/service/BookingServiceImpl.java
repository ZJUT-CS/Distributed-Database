package com.team.skylink.module.booking.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.team.skylink.common.Result;
import com.team.skylink.common.enums.OrderStatusEnum;
import com.team.skylink.common.exception.InventoryShortageException;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper;
import com.team.skylink.module.booking.dto.BookingFlightDto;
import com.team.skylink.module.booking.dto.BookingRequest;
import com.team.skylink.module.booking.dto.BookingResponse;
import com.team.skylink.module.booking.service.BookingService;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.flight.service.SeatService;
import com.team.skylink.module.flight.mapper.RouteMapper;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.user.mapper.UserMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class BookingServiceImpl implements BookingService {

    private final OrderMapper orderMapper;
    private final FlightMapper flightMapper;
    private final AircraftCabinConfigMapper configMapper;
    private final UserMapper userMapper;
    private final RouteMapper routeMapper;
    private final SeatService seatService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public BookingServiceImpl(OrderMapper orderMapper, FlightMapper flightMapper,
                              AircraftCabinConfigMapper configMapper, UserMapper userMapper,
                              RouteMapper routeMapper, SeatService seatService) {
        this.orderMapper = orderMapper;
        this.flightMapper = flightMapper;
        this.configMapper = configMapper;
        this.userMapper = userMapper;
        this.routeMapper = routeMapper;
        this.seatService = seatService;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Map<String, Object>> submitBooking(BookingRequest req) {
        if (req.getFlightIds() == null || req.getFlightIds().isEmpty()) {
            return Result.fail(400, "请至少选择一个航班");
        }
        if (req.getCabinId() == null) {
            return Result.fail(400, "请选择舱位");
        }

        boolean isInterline = Boolean.TRUE.equals(req.getIsInterline()) && req.getFlightIds().size() > 1;

        try {
            // 1. 创建订单 (并在内部锁定座位)
            String passengersJson = objectMapper.writeValueAsString(req.getPassengers());
            Map<String, Object> result;

            if (isInterline) {
                result = createInterlineOrders(req, passengersJson);
            } else {
                result = createIndependentOrders(req, passengersJson);
            }
            return Result.ok(result);
        } catch (InventoryShortageException e) {
            return Result.fail(400, e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private Map<String, Object> createInterlineOrders(BookingRequest req, String passengersJson) {
        long parentOrderId = IdWorker.getId();
        List<Long> flightIds = req.getFlightIds();
        
        // 获取舱位类型 (假设所有航段舱位一致)
        AircraftCabinConfig config = configMapper.selectById(req.getCabinId());
        if (config == null) {
            throw new IllegalArgumentException("Invalid Cabin ID");
        }
        String cabinType = config.getCabinType();

        // 1. 预生成订单ID并准备锁请求
        List<SeatService.SeatLockRequest> lockRequests = new ArrayList<>();
        List<Long> orderIds = new ArrayList<>();

        for (Long flightId : flightIds) {
            long orderId = IdWorker.getId();
            orderIds.add(orderId);

            SeatService.SeatLockRequest lockReq = new SeatService.SeatLockRequest();
            lockReq.setFlightId(flightId);
            lockReq.setCabinType(cabinType);
            lockReq.setCount(req.getPassengers().size());
            lockReq.setOrderId(orderId);
            lockRequests.add(lockReq);
        }

        // 2. 批量加锁 (按FlightId排序 + SELECT FOR UPDATE)
        seatService.lockSeatsBatch(lockRequests);

        // 3. 保存订单 (跳过内部加锁)
        for (int i = 0; i < flightIds.size(); i++) {
            saveSingleOrder(req.getUserId(), flightIds.get(i), req.getCabinId(), parentOrderId,
                    i == 0 ? 1 : 2, passengersJson, req.getPassengers().size(), true, orderIds.get(i));
        }
        
        Map<String, Object> res = new HashMap<>();
        res.put("parentOrderId", String.valueOf(parentOrderId));
        res.put("orderIds", orderIds.stream().map(String::valueOf).collect(Collectors.toList()));
        return res;
    }

    private Map<String, Object> createIndependentOrders(BookingRequest req, String passengersJson) {
        List<String> orderIds = new ArrayList<>();
        for (Long flightId : req.getFlightIds()) {
            Long orderId = saveSingleOrder(req.getUserId(), flightId, req.getCabinId(), null, 0, passengersJson, req.getPassengers().size(), false, null);
            orderIds.add(String.valueOf(orderId));
        }
        Map<String, Object> res = new HashMap<>();
        res.put("orderIds", orderIds);
        return res;
    }

    private Long saveSingleOrder(Long userId, Long flightId, Long cabinId, Long parentOrderId, Integer tripType, String passengersJson, int ticketNum, boolean skipLock, Long preGeneratedOrderId) {
        Flight flight = flightMapper.selectById(flightId);
        // ... (rest same as before)
        AircraftCabinConfig config = configMapper.selectById(cabinId);
        Route route = routeMapper.selectById(flight.getRouteId());
        
        BigDecimal basePrice = route.getBasePrice();
        if (config.getCabinCoefficient() != null) {
            basePrice = basePrice.multiply(config.getCabinCoefficient());
        }
        
        Orders order = new Orders();
        if (preGeneratedOrderId != null) {
            order.setOrderId(preGeneratedOrderId);
        }
        order.setUserId(userId);
        order.setFlightId(flightId);
        order.setCabinId(cabinId);
        order.setTotalAmount(basePrice.multiply(new BigDecimal(ticketNum)));
        order.setTicketNum(ticketNum);
        order.setOrderStatus(OrderStatusEnum.PENDING_AUDIT.getCode());
        order.setParentOrderId(parentOrderId);
        order.setTripType(tripType);
        order.setOrderTime(LocalDateTime.now());
        order.setPassengersJson(passengersJson);
        
        // 生成快照
        try {
            Map<String, Object> snapshot = new HashMap<>();
            snapshot.put("flightNo", flight.getFlightNo());
            snapshot.put("departureCity", flight.getDepartureCity());
            snapshot.put("arrivalCity", flight.getArrivalCity());
            snapshot.put("departureTime", flight.getDepartureTime() != null ? flight.getDepartureTime().toString() : "");
            snapshot.put("arrivalTime", flight.getArrivalTime() != null ? flight.getArrivalTime().toString() : "");
            snapshot.put("airlineCompany", flight.getAirlineCompany());
            snapshot.put("cabinType", config.getCabinType());
            snapshot.put("unitPrice", basePrice);
            order.setFlightSnapshot(objectMapper.writeValueAsString(snapshot));
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate flight snapshot", e);
        }

        orderMapper.insert(order);

        // 锁定座位 (如果不跳过)
        if (!skipLock) {
            seatService.lockSeats(flightId, config.getCabinType(), ticketNum, order.getOrderId());
        }
        
        return order.getOrderId();
    }

    @Override
    public List<BookingResponse> listBookings(Long userId) {
        List<Orders> orders = orderMapper.selectList(new QueryWrapper<Orders>()
                .eq("user_id", userId).orderByDesc("order_time"));
        
        List<BookingResponse> resp = new ArrayList<>();

        for (Orders o : orders) {
            Flight f = flightMapper.selectById(o.getFlightId());
            AircraftCabinConfig c = (o.getCabinId() != null) ? configMapper.selectById(o.getCabinId()) : null;
            
            BookingResponse r = new BookingResponse();
            r.setId(String.valueOf(o.getOrderId()));
            r.setTotalPrice(o.getTotalAmount());
            r.setStatus(String.valueOf(o.getOrderStatus()));
            r.setBookingDate(o.getOrderTime());
            r.setCabinClass(c != null ? c.getCabinType() : null);
            
            if (f != null) {
                BookingFlightDto dto = new BookingFlightDto();
                dto.setId(String.valueOf(f.getFlightId()));
                dto.setFlightNumber(f.getFlightNo());
                dto.setOrigin(f.getDepartureCity());
                dto.setDestination(f.getArrivalCity());
                dto.setDepartureTime(f.getDepartureTime());
                dto.setArrivalTime(f.getArrivalTime());
                dto.setAirline(f.getAirlineCompany());
                if (c != null) {
                    dto.setCabinType(c.getCabinType());
                }
                
                if (f.getDepartureTime() != null && f.getArrivalTime() != null) {
                     java.time.Duration d = java.time.Duration.between(f.getDepartureTime(), f.getArrivalTime());
                     long hours = d.toHours();
                     long minutes = d.toMinutesPart();
                     dto.setDuration(hours + "h" + minutes + "m");
                }
                
                r.setFlight(dto);
                r.setFlights(Arrays.asList(dto));
            }
            
            resp.add(r);
        }
        return resp;
    }
}