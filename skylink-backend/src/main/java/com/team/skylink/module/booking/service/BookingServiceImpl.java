package com.team.skylink.module.booking.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.team.skylink.common.Result;
import com.team.skylink.common.enums.OrderStatusEnum;
import com.team.skylink.common.exception.InventoryShortageException;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper;
import com.team.skylink.module.booking.dto.BookingFlightDto;
import com.team.skylink.module.booking.dto.BookingRequest;
import com.team.skylink.module.booking.dto.BookingResponse;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.flight.entity.Seat; // 确保导入 Seat
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.flight.mapper.RouteMapper;
import com.team.skylink.module.flight.service.SeatService;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.order.service.PriceStrategyService;
import com.team.skylink.module.user.mapper.UserMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
public class BookingServiceImpl implements BookingService {

    private final OrderMapper orderMapper;
    private final FlightMapper flightMapper;
    private final AircraftCabinConfigMapper configMapper;
    private final UserMapper userMapper;
    private final RouteMapper routeMapper;
    private final SeatService seatService;
    private final PriceStrategyService priceStrategyService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public BookingServiceImpl(OrderMapper orderMapper, FlightMapper flightMapper,
            AircraftCabinConfigMapper configMapper, UserMapper userMapper,
            RouteMapper routeMapper, SeatService seatService, PriceStrategyService priceStrategyService) {
        this.orderMapper = orderMapper;
        this.flightMapper = flightMapper;
        this.configMapper = configMapper;
        this.userMapper = userMapper;
        this.routeMapper = routeMapper;
        this.seatService = seatService;
        this.priceStrategyService = priceStrategyService;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Map<String, Object>> submitBooking(BookingRequest req) {
        log.info("收到预订请求 flightIds={} cabinId={} userId={} interline={}", req.getFlightIds(), req.getCabinId(), req.getUserId(), req.getIsInterline());
        if (req.getFlightIds() == null || req.getFlightIds().isEmpty()) {
            return Result.fail(400, "请至少选择一个航班");
        }
        if (req.getCabinId() == null) {
            return Result.fail(400, "请选择舱位");
        }

        boolean isInterline = Boolean.TRUE.equals(req.getIsInterline()) && req.getFlightIds().size() > 1;

        // 解析航班ID（处理 "ID1+ID2" 格式）
        List<Long> parsedFlightIds = new ArrayList<>();
        if (req.getFlightIds() != null) {
            for (String fidStr : req.getFlightIds()) {
                if (fidStr == null || fidStr.isBlank()) continue;
                if (fidStr.contains("+")) {
                    String[] parts = fidStr.split("\\+");
                    for (String part : parts) {
                        try { parsedFlightIds.add(Long.parseLong(part.trim())); } catch (Exception e) {}
                    }
                } else {
                    try { parsedFlightIds.add(Long.parseLong(fidStr.trim())); } catch (Exception e) {}
                }
            }
        }

        try {
            // 序列化乘客信息
            String passengersJson = objectMapper.writeValueAsString(req.getPassengers());
            Map<String, Object> result;

            if (isInterline) {
                result = createInterlineOrders(req, parsedFlightIds, passengersJson);
            } else {
                result = createIndependentOrders(req, parsedFlightIds, passengersJson);
            }
            return Result.ok(result);
        } catch (InventoryShortageException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private Map<String, Object> createInterlineOrders(BookingRequest req, List<Long> flightIds, String passengersJson) {
        long parentOrderId = IdWorker.getId();
        // List<Long> flightIds = req.getFlightIds(); // 已移除，使用参数传入的 flightIds

        AircraftCabinConfig config = configMapper.selectById(req.getCabinId());
        if (config == null) {
            throw new IllegalArgumentException("Invalid Cabin ID");
        }
        String cabinType = config.getCabinType();
        int passengerCount = req.getPassengers().size();
        Long userId = req.getUserId();

        List<String> orderIdStrs = new ArrayList<>();
        List<Long> createdOrderIds = new ArrayList<>();

        // 【修改点】 第一阶段：锁座 -> 建单 -> 关联（暂不应用联程折扣）
        for (int i = 0; i < flightIds.size(); i++) {
            Long flightId = flightIds.get(i);

            // ✅ 添加参数验证
            if (flightId == null) {
                log.error("❌ flightId is null at index {}, flightIds={}", i, flightIds);
                throw new IllegalArgumentException("航班ID不能为空 (索引: " + i + ")");
            }

            if (cabinType == null || cabinType.trim().isEmpty()) {
                log.error("❌ cabinType is null or empty, cabinId={}, config={}", req.getCabinId(), config);
                throw new IllegalArgumentException("舱位类型不能为空");
            }

            log.info("🔍 准备锁座: flightId={}, cabinType={}, passengerCount={}, userId={}",
                    flightId, cabinType, passengerCount, userId);
            try {
                Integer avail = seatService.getAvailableCount(flightId, cabinType);
                log.info("可用座位统计 flightId={} cabinType={} available={}", flightId, cabinType, avail);
            } catch (Exception ignore) {}

            // 1. 先尝试锁座 (传入 UserId)
            List<Seat> lockedSeats = seatService.lockSeats(flightId, cabinType, passengerCount, userId);

            // 2. 生成订单 ID
            long orderId = IdWorker.getId();
            orderIdStrs.add(String.valueOf(orderId));
            createdOrderIds.add(orderId);

            // 3. 关联订单ID到座位
            List<Long> seatIds = lockedSeats.stream().map(Seat::getSeatId).collect(Collectors.toList());
            seatService.associateOrder(userId, seatIds, orderId);

            // 4. 保存订单到数据库 (tripType: 1=去程/第一段, 2=返程/第二段)
            saveSingleOrder(userId, flightId, req.getCabinId(), parentOrderId,
                    i == 0 ? 1 : 2, passengersJson, passengerCount, orderId, lockedSeats, req.getAddons());
        }

        // 【新增】 第二阶段：计算联程折扣，更新所有子订单金额
        BigDecimal totalOriginalAmount = BigDecimal.ZERO;
        List<Orders> orders = orderMapper.selectBatchIds(createdOrderIds);
        Map<Long, BigDecimal> orderIdToOriginalAmount = new HashMap<>();

        for (Orders order : orders) {
            orderIdToOriginalAmount.put(order.getOrderId(), order.getTotalAmount());
            totalOriginalAmount = totalOriginalAmount.add(order.getTotalAmount());
        }

        BigDecimal totalDiscountedAmount = priceStrategyService.applyInterlineDiscount(totalOriginalAmount);
        log.info("联程折扣应用：原总价={}, 折扣后总价={}", totalOriginalAmount, totalDiscountedAmount);

        for (Orders order : orders) {
            BigDecimal originalAmount = orderIdToOriginalAmount.get(order.getOrderId());
            BigDecimal ratio = originalAmount.divide(totalOriginalAmount, 4, java.math.RoundingMode.HALF_UP);
            BigDecimal discountedAmount = totalDiscountedAmount.multiply(ratio).setScale(2, java.math.RoundingMode.HALF_UP);
            
            order.setTotalAmount(discountedAmount);
            // Avoid updateById to prevent ShardingSphere "Can not update sharding value" error
            orderMapper.update(null, Wrappers.<Orders>lambdaUpdate()
                    .eq(Orders::getOrderId, order.getOrderId())
                    .set(Orders::getTotalAmount, discountedAmount));
            log.info("更新订单金额：orderId={}, 原金额={}, 新金额={}", order.getOrderId(), originalAmount, discountedAmount);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("parentOrderId", String.valueOf(parentOrderId));
        res.put("orderIds", orderIdStrs);
        return res;
    }

    private Map<String, Object> createIndependentOrders(BookingRequest req, List<Long> flightIds, String passengersJson) {
        List<String> orderIds = new ArrayList<>();

        AircraftCabinConfig config = configMapper.selectById(req.getCabinId());
        if (config == null)
            throw new IllegalArgumentException("Invalid Cabin ID");

        String cabinType = config.getCabinType();
        int passengerCount = req.getPassengers().size();
        Long userId = req.getUserId();

        // 【修改点】 循环处理每个独立航班
        for (Long flightId : flightIds) {
            // 1. 先锁座
            try {
                Integer avail = seatService.getAvailableCount(flightId, cabinType);
                log.info("可用座位统计 flightId={} cabinType={} available={}", flightId, cabinType, avail);
            } catch (Exception ignore) {}
            List<Seat> lockedSeats = seatService.lockSeats(flightId, cabinType, passengerCount, userId);

            // 2. 生成 ID
            long orderId = IdWorker.getId();
            orderIds.add(String.valueOf(orderId));

            // 3. 关联
            List<Long> seatIds = lockedSeats.stream().map(Seat::getSeatId).collect(Collectors.toList());
            seatService.associateOrder(userId, seatIds, orderId);

            // 4. 保存 (tripType=0 单程)
            saveSingleOrder(userId, flightId, req.getCabinId(), null, 0, passengersJson, passengerCount, orderId, lockedSeats, req.getAddons());
        }

        Map<String, Object> res = new HashMap<>();
        res.put("orderIds", orderIds);
        return res;
    }

    /**
     * 【修改点】只负责保存 Orders 对象，不再负责锁座
     */
    private void saveSingleOrder(Long userId, Long flightId, Long cabinId, Long parentOrderId,
            Integer tripType, String passengersJson, int ticketNum, Long orderId, List<Seat> seats, BookingRequest.Addons addons) {
        Flight flight = flightMapper.selectById(flightId);
        AircraftCabinConfig config = configMapper.selectById(cabinId);
        Route route = routeMapper.selectById(flight.getRouteId());

        boolean isInterline = parentOrderId != null;
        BigDecimal unitPrice = priceStrategyService.calculateSegmentPrice(flight, route, config, isInterline, userId);
        BigDecimal totalPrice = unitPrice.multiply(new BigDecimal(ticketNum));
        // User discount logic is now handled in calculateSegmentPrice (L4 strategy)

        // Add Taxes and Fees
        // Tax: 120 per passenger
        BigDecimal tax = new BigDecimal("120").multiply(new BigDecimal(ticketNum));
        totalPrice = totalPrice.add(tax);

        // Addons
        if (addons != null) {
            if (Boolean.TRUE.equals(addons.getInsurance())) {
                totalPrice = totalPrice.add(new BigDecimal("30").multiply(new BigDecimal(ticketNum)));
            }
            if (Boolean.TRUE.equals(addons.getFastTicket())) {
                totalPrice = totalPrice.add(new BigDecimal("20").multiply(new BigDecimal(ticketNum)));
            }
        }
        
        log.info("Saving order: flightId={}, totalPrice={}, ticketNum={}", flightId, totalPrice, ticketNum);

        Orders order = new Orders();

        order.setOrderId(orderId); // 必填：使用外部生成的ID
        if (seats != null && !seats.isEmpty()) {
            order.setSeatId(seats.get(0).getSeatId());
        }
        order.setUserId(userId);
        order.setFlightId(flightId);
        order.setCabinId(cabinId);
        order.setTotalAmount(totalPrice);
        order.setTicketNum(ticketNum);
        order.setOrderStatus(OrderStatusEnum.PENDING_PAYMENT.getCode());
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
            snapshot.put("departureTime",
                    flight.getDepartureTime() != null ? flight.getDepartureTime().toString() : "");
            snapshot.put("arrivalTime", flight.getArrivalTime() != null ? flight.getArrivalTime().toString() : "");
            snapshot.put("airlineCompany", flight.getAirlineCompany());
            snapshot.put("cabinType", config.getCabinType());
            snapshot.put("unitPrice", unitPrice);
            order.setFlightSnapshot(objectMapper.writeValueAsString(snapshot));
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate flight snapshot", e);
        }

        orderMapper.insert(order);
        // 注意：这里不再调用 seatService.lockSeats，因为前面已经锁完了
    }

    @Override
    public List<BookingResponse> listBookings(Long userId) {
        List<Orders> orders = orderMapper.selectList(new QueryWrapper<Orders>()
                .eq("user_id", userId).orderByDesc("order_time"));

        if (orders.isEmpty()) {
            return new ArrayList<>();
        }

        // Optimization: Bulk Fetch
        Set<Long> flightIds = orders.stream().map(Orders::getFlightId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Long> cabinIds = orders.stream().map(Orders::getCabinId).filter(Objects::nonNull).collect(Collectors.toSet());

        Map<Long, Flight> flightMap = new HashMap<>();
        if (!flightIds.isEmpty()) {
            List<Flight> flights = flightMapper.selectBatchIds(flightIds);
            flightMap = flights.stream().collect(Collectors.toMap(Flight::getFlightId, Function.identity()));
        }

        Map<Long, AircraftCabinConfig> configMap = new HashMap<>();
        if (!cabinIds.isEmpty()) {
            List<AircraftCabinConfig> configs = configMapper.selectBatchIds(cabinIds);
            configMap = configs.stream().collect(Collectors.toMap(AircraftCabinConfig::getConfigId, Function.identity()));
        }

        List<BookingResponse> resp = new ArrayList<>();

        for (Orders o : orders) {
            Flight f = flightMap.get(o.getFlightId());
            AircraftCabinConfig c = (o.getCabinId() != null) ? configMap.get(o.getCabinId()) : null;

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
