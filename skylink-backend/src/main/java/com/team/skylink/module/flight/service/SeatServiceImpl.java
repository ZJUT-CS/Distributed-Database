package com.team.skylink.module.flight.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.skylink.common.exception.InventoryShortageException;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper;
import com.team.skylink.module.flight.entity.Seat;
import com.team.skylink.module.flight.mapper.SeatMapper;
import com.team.skylink.module.order.mapper.OrderMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisCallback;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.nio.charset.StandardCharsets;

/**
 * 座位服务实现类
 */
@Slf4j
@Service
public class SeatServiceImpl extends ServiceImpl<SeatMapper, Seat> implements SeatService {

    private final AircraftCabinConfigMapper configMapper;
    private final OrderMapper orderMapper;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public SeatServiceImpl(SeatMapper seatMapper,
            AircraftCabinConfigMapper configMapper,
            OrderMapper orderMapper,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper) {
        this.configMapper = configMapper;
        this.orderMapper = orderMapper;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * 锁定座位 (Mode A)
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<Seat> lockSeats(Long flightId, String cabinType, int count, Long userId) {
        List<Seat> lockedSeats = new ArrayList<>();

        try {
            List<String> types = cabinTypeVariants(cabinType);
            long initialAvailable = count(Wrappers.<Seat>lambdaQuery()
                    .eq(Seat::getFlightId, flightId)
                    .in(Seat::getCabinType, types)
                    .eq(Seat::getStatus, 1));
            log.info("lockSeats start flightId={} cabinType={} variants={} initialAvailable={}", flightId, cabinType, types, initialAvailable);
            for (int i = 0; i < count; i++) {
                boolean success = false;
                int retry = 0;
                // 自旋重试
                while (!success && retry < 10) {
                    Seat seat = baseMapper.selectOne(Wrappers.<Seat>lambdaQuery()
                            .eq(Seat::getFlightId, flightId)
                            .in(Seat::getCabinType, types)
                            .eq(Seat::getStatus, 1)
                            .last("LIMIT 1"));

                    if (seat == null) {
                        long available = count(Wrappers.<Seat>lambdaQuery()
                                .eq(Seat::getFlightId, flightId)
                                .in(Seat::getCabinType, types)
                                .eq(Seat::getStatus, 1));
                        log.error("no seat found flightId={} cabinType={} variants={} available={}", flightId, cabinType, types, available);
                        throw new InventoryShortageException("余票不足 (" + cabinType + ")");
                    }

                    seat.setStatus(3);
                    seat.setUserId(userId);
                    seat.setOrderId(null);
                    seat.setUpdateTime(LocalDateTime.now());
                    
                    int rows = baseMapper.updateById(seat);

                    if (rows > 0) {
                        success = true;
                        lockedSeats.add(seat);
                        try {
                            updateRedisSeatStatus(flightId, seat.getSeatId(), 3);
                        } catch (Exception e) {
                            log.warn("Redis update failed", e);
                        }
                    } else {
                        log.warn("optimistic lock conflict flightId={} seatId={} retry={}", flightId, seat.getSeatId(), retry);
                        retry++;
                    }
                }

                if (!success) {
                    log.error("lockSeats failed after retries flightId={} cabinType={} variants={} userId={}", flightId, cabinType, types, userId);
                    throw new InventoryShortageException("系统繁忙，座位锁定失败，请稍后重试");
                }
            }
        } catch (Exception e) {
            // 回滚 Redis
            for (Seat s : lockedSeats) {
                try {
                    updateRedisSeatStatus(flightId, s.getSeatId(), 1);
                } catch (Exception ex) {
                    log.warn("Failed to revert Redis status for seat {}", s.getSeatId(), ex);
                }
            }
            throw e;
        }
        return lockedSeats;
    }

    /**
     * 关联订单
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void associateOrder(Long userId, List<Long> seatIds, Long orderId) {
        if (seatIds == null || seatIds.isEmpty())
            return;

        Seat updateParams = new Seat();
        updateParams.setOrderId(orderId);

        boolean updated = update(updateParams, Wrappers.<Seat>lambdaUpdate()
                .in(Seat::getSeatId, seatIds)
                .eq(Seat::getUserId, userId)
                .eq(Seat::getStatus, 3));

        if (!updated) {
            throw new RuntimeException("关联订单失败，座位锁可能已失效或超时");
        }
    }

    /**
     * 随机锁定单座 (Mode B)
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long lockRandomSeat(Long flightId, Long cabinId, Long userId) {
        AircraftCabinConfig cfg = configMapper.selectById(cabinId);
        if (cfg == null)
            throw new IllegalArgumentException("无效的舱位ID");

        int retry = 0;
        List<String> types = cabinTypeVariants(cfg.getCabinType());
        while (retry < 5) {
            long total = count(Wrappers.<Seat>lambdaQuery()
                    .eq(Seat::getFlightId, flightId)
                    .in(Seat::getCabinType, types)
                    .eq(Seat::getStatus, 1));

            if (total == 0) {
                log.error("lockRandomSeat no inventory flightId={} cabinId={} cabinType={} variants={}", flightId, cabinId, cfg.getCabinType(), types);
                throw new InventoryShortageException("抱歉，该航班座位已售罄");
            }

            long offset = ThreadLocalRandom.current().nextLong(total);

            Seat seat = baseMapper.selectOne(Wrappers.<Seat>lambdaQuery()
                    .eq(Seat::getFlightId, flightId)
                    .in(Seat::getCabinType, types)
                    .eq(Seat::getStatus, 1)
                    .last("LIMIT 1 OFFSET " + offset));

            if (seat != null) {
                seat.setStatus(3);
                seat.setUserId(userId);
                seat.setOrderId(null);

                int rows = baseMapper.updateById(seat);
                if (rows > 0) {
                    try {
                        updateRedisSeatStatus(flightId, seat.getSeatId(), 3);
                    } catch (Exception e) {
                        log.warn("Redis update failed", e);
                    }
                    log.info("lockRandomSeat success flightId={} seatId={} cabinType={} userId={}", flightId, seat.getSeatId(), seat.getCabinType(), userId);
                    return seat.getSeatId();
                }
            }
            log.warn("lockRandomSeat retry flightId={} cabinId={} retry={}", flightId, cabinId, retry);
            retry++;
        }
        log.error("lockRandomSeat failed flightId={} cabinId={} cabinType={} userId={}", flightId, cabinId, cfg.getCabinType(), userId);
        throw new InventoryShortageException("系统繁忙，锁定座位失败，请重试");
    }

    /**
     * 释放单个座位
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean releaseSeat(Long seatId) {
        Seat seat = baseMapper.selectById(seatId);
        if (seat == null) return false;

        boolean ok = update(null, Wrappers.<Seat>lambdaUpdate()
                .eq(Seat::getSeatId, seatId)
                .set(Seat::getStatus, 1)
                .set(Seat::getOrderId, null)
                .set(Seat::getUserId, null)
                .set(Seat::getPassengerIndex, null));
        
        if (ok) {
            updateRedisSeatStatus(seat.getFlightId(), seatId, 1);
        }
        return ok;
    }

    /**
     * 确认座位 (批量)
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean confirmSeats(Long orderId) {
        List<Seat> seats = list(Wrappers.<Seat>lambdaQuery().eq(Seat::getOrderId, orderId).eq(Seat::getStatus, 3));
        if (seats.isEmpty()) return true;

        boolean ok = update(null, Wrappers.<Seat>lambdaUpdate()
                .eq(Seat::getOrderId, orderId)
                .eq(Seat::getStatus, 3)
                .set(Seat::getStatus, 2));
        
        if (ok) {
            for (Seat s : seats) {
                updateRedisSeatStatus(s.getFlightId(), s.getSeatId(), 2);
            }
        }
        return ok;
    }

    /**
     * 释放订单所有座位
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean releaseSeats(Long orderId) {
        List<Seat> seats = list(Wrappers.<Seat>lambdaQuery().eq(Seat::getOrderId, orderId));
        if (seats.isEmpty()) return true;

        boolean ok = update(null, Wrappers.<Seat>lambdaUpdate()
                .eq(Seat::getOrderId, orderId)
                .set(Seat::getStatus, 1)
                .set(Seat::getOrderId, null)
                .set(Seat::getUserId, null)
                .set(Seat::getPassengerIndex, null));

        if (ok) {
            for (Seat s : seats) {
                updateRedisSeatStatus(s.getFlightId(), s.getSeatId(), 1);
            }
        }
        return ok;
    }

    /**
     * 换座
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean changeSeat(Long orderId, Long newSeatId) {
        var order = orderMapper.selectById(orderId);
        if (order == null) {
            log.warn("changeSeat: Order not found id={}", orderId);
            return false;
        }
        var seat = baseMapper.selectById(newSeatId);
        if (seat == null) {
            log.warn("changeSeat: Seat not found id={}", newSeatId);
            return false;
        }
        if (!Objects.equals(seat.getFlightId(), order.getFlightId())) {
            log.warn("changeSeat: Flight mismatch. Order flight={}, Seat flight={}", order.getFlightId(),
                    seat.getFlightId());
            return false;
        }
        var cfg = configMapper.selectById(order.getCabinId());
        if (cfg == null) {
            log.warn("changeSeat: Cabin config not found for cabinId={}", order.getCabinId());
            return false;
        }
        if (cfg.getCabinType() != null && !cfg.getCabinType().equalsIgnoreCase(seat.getCabinType())) {
            log.warn("changeSeat: Cabin type mismatch. Config={}, Seat={}", cfg.getCabinType(), seat.getCabinType());
            return false;
        }
        boolean ok = update(null, Wrappers.<Seat>lambdaUpdate()
                .eq(Seat::getSeatId, newSeatId)
                .eq(Seat::getStatus, 1)
                .set(Seat::getStatus, 3)
                .set(Seat::getOrderId, orderId));
        if (!ok)
            return false;
        
        try {
            updateRedisSeatStatus(seat.getFlightId(), newSeatId, 3);
        } catch (Exception e) {
            log.warn("Redis update failed for changeSeat", e);
        }

        if (order.getSeatId() != null && !Objects.equals(order.getSeatId(), newSeatId)) {
            releaseSeat(order.getSeatId());
        }

        orderMapper.update(null, Wrappers.<com.team.skylink.module.order.entity.Orders>lambdaUpdate()
                .eq(com.team.skylink.module.order.entity.Orders::getOrderId, orderId)
                .set(com.team.skylink.module.order.entity.Orders::getSeatId, newSeatId)
                .set(com.team.skylink.module.order.entity.Orders::getChangeTime, LocalDateTime.now()));

        return true;
    }

    @Override
    public Integer getAvailableCount(Long flightId, String cabinType) {
        List<String> types = cabinTypeVariants(cabinType);
        return Math.toIntExact(count(Wrappers.<Seat>lambdaQuery()
                .eq(Seat::getFlightId, flightId)
                .in(Seat::getCabinType, types)
                .eq(Seat::getStatus, 1)));
    }

    @Override
    public Map<Long, Map<String, Integer>> getAvailableCountBatch(List<Long> flightIds) {
        if (flightIds == null || flightIds.isEmpty())
            return Collections.emptyMap();
        List<Map<String, Object>> results = baseMapper.countAvailableSeatsBatch(flightIds);
        Map<Long, Map<String, Integer>> resultMap = new HashMap<>();
        for (Map<String, Object> row : results) {
            Long fid = ((Number) row.get("flightId")).longValue();
            String cType = (String) row.get("cabinType");
            Integer count = ((Number) row.get("count")).intValue();
            resultMap.computeIfAbsent(fid, k -> new HashMap<>()).put(cType, count);
        }
        return resultMap;
    }

    /**
     * 确认单个座位
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean confirmSeat(Long seatId, Long orderId) {
        Seat seat = baseMapper.selectById(seatId);
        if (seat == null) return false;

        boolean ok = update(null, Wrappers.<Seat>lambdaUpdate()
                .eq(Seat::getSeatId, seatId)
                .eq(Seat::getStatus, 3)
                .set(Seat::getStatus, 2)
                .set(Seat::getOrderId, orderId));
        
        if (ok) {
            updateRedisSeatStatus(seat.getFlightId(), seatId, 2);
        }
        return ok;
    }

    /**
     * 获取座位图 (Redis + DB Fallback)
     */
    @Override
    public List<Seat> getSeatMap(Long flightId) {
        String listKey = getSeatListKey(flightId);
        String bitmapKey = getBitmapKey(flightId);

        String json = redisTemplate.opsForValue().get(listKey);
        if (json == null) {
            syncSeatMapToRedis(flightId);
            json = redisTemplate.opsForValue().get(listKey);
            if (json == null) return Collections.emptyList();
        }

        List<Seat> seats;
        try {
            seats = objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<List<Seat>>(){});
        } catch (Exception e) {
            log.error("Failed to parse seat list", e);
            return Collections.emptyList();
        }

        List<Object> results = redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
            for (int i = 0; i < seats.size(); i++) {
                connection.getBit(bitmapKey.getBytes(StandardCharsets.UTF_8), i);
            }
            return null;
        });

        for (int i = 0; i < seats.size(); i++) {
            Boolean occupied = (Boolean) results.get(i);
            seats.get(i).setStatus(occupied ? 2 : 1);
        }
        return seats;
    }

    // 辅助方法

    private List<String> cabinTypeVariants(String cabinType) {
        String t = cabinType == null ? "" : cabinType.trim().toUpperCase();
        if ("ECONOMY".equals(t)) return java.util.Arrays.asList("ECONOMY", "Y");
        if ("BUSINESS".equals(t)) return java.util.Arrays.asList("BUSINESS", "J");
        if ("FIRST".equals(t)) return java.util.Arrays.asList("FIRST", "F");
        if ("Y".equals(t)) return java.util.Arrays.asList("Y", "ECONOMY");
        if ("J".equals(t)) return java.util.Arrays.asList("J", "BUSINESS");
        if ("F".equals(t)) return java.util.Arrays.asList("F", "FIRST");
        return java.util.Collections.singletonList(t);
    }

    private String getSeatListKey(Long flightId) { return "flight:" + flightId + ":seats"; }
    private String getBitmapKey(Long flightId) { return "flight:" + flightId + ":bitmap"; }
    private String getSeatIndexKey(Long flightId) { return "flight:" + flightId + ":seat_index"; }

    private void syncSeatMapToRedis(Long flightId) {
        List<Seat> seats = baseMapper.selectList(Wrappers.<Seat>lambdaQuery()
                .eq(Seat::getFlightId, flightId)
                .orderByAsc(Seat::getSeatId));

        if (seats.isEmpty()) return;

        try {
            String json = objectMapper.writeValueAsString(seats);
            redisTemplate.opsForValue().set(getSeatListKey(flightId), json, 1, TimeUnit.HOURS);
        } catch (Exception e) {
            log.error("Failed to cache seat list", e);
        }

        try {
            Map<String, String> indexMap = new HashMap<>();
            for (int i = 0; i < seats.size(); i++) {
                indexMap.put(String.valueOf(seats.get(i).getSeatId()), String.valueOf(i));
            }
            redisTemplate.opsForHash().putAll(getSeatIndexKey(flightId), indexMap);
            redisTemplate.expire(getSeatIndexKey(flightId), 1, TimeUnit.HOURS);

            String bitmapKey = getBitmapKey(flightId);
            redisTemplate.delete(bitmapKey);
            for (int i = 0; i < seats.size(); i++) {
                Seat s = seats.get(i);
                boolean isOccupied = s.getStatus() != 1;
                redisTemplate.opsForValue().setBit(bitmapKey, i, isOccupied);
            }
            redisTemplate.expire(bitmapKey, 1, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Failed to sync seat map to Redis", e);
        }
    }

    private void updateRedisSeatStatus(Long flightId, Long seatId, Integer status) {
        try {
            Object indexObj = redisTemplate.opsForHash().get(getSeatIndexKey(flightId), String.valueOf(seatId));
            if (indexObj == null) {
                syncSeatMapToRedis(flightId);
                indexObj = redisTemplate.opsForHash().get(getSeatIndexKey(flightId), String.valueOf(seatId));
                if (indexObj == null) return;
            }
            long index = Long.parseLong((String) indexObj);
            boolean occupied = status != 1;
            redisTemplate.opsForValue().setBit(getBitmapKey(flightId), index, occupied);
        } catch (Exception e) {
            log.warn("Redis update failed", e);
        }
    }
}
