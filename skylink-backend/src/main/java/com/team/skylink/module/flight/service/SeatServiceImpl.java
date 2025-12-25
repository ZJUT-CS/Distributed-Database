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

/**
 * 座位服务实现类
 */
@Slf4j
@Service
public class SeatServiceImpl extends ServiceImpl<SeatMapper, Seat> implements SeatService {

    private final AircraftCabinConfigMapper configMapper;
    // OrderMapper 在此处主要用于查单，若不需要可移除，降低耦合
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
     * 【核心修改】Mode A：锁定座位
     * 1. 使用 userId 进行锁定，此时 orderId 设为 null。
     * 2. 采用乐观锁 + 重试机制，防止超卖。
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<Seat> lockSeats(Long flightId, String cabinType, int count, Long userId) {
        List<Seat> lockedSeats = new ArrayList<>();

        try {
            for (int i = 0; i < count; i++) {
                boolean success = false;
                int retry = 0;
                // 自旋重试，解决并发冲突
                while (!success && retry < 10) {
                    // 1. 查询一个可用座位 (Status=1)
                    Seat seat = baseMapper.selectOne(Wrappers.<Seat>lambdaQuery()
                            .eq(Seat::getFlightId, flightId)
                            .eq(Seat::getCabinType, cabinType)
                            .eq(Seat::getStatus, 1) // 1-可用
                            .last("LIMIT 1")); // 只取一个

                    if (seat == null) {
                        throw new InventoryShortageException("余票不足 (" + cabinType + ")");
                    }

                    // 2. 修改状态准备更新
                    seat.setStatus(3); // 3-锁定中
                    seat.setUserId(userId); // 【关键】记录是谁锁的
                    seat.setOrderId(null); // 暂时不填订单号，等订单生成后再回填
                    seat.setUpdateTime(LocalDateTime.now());
                    // 3. 执行更新 (MyBatis-Plus 会自动校验 @Version 版本号)
                    // 如果 version 被别人改了，rows 就会返回 0
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
                        // 更新失败，说明被别人抢先修改了版本号，进行重试
                        retry++;
                    }
                }

                if (!success) {
                    // 如果循环多次都失败，抛出异常回滚之前锁定的座位（Transactional 会处理）
                    throw new InventoryShortageException("系统繁忙，座位锁定失败，请稍后重试");
                }
            }
        } catch (Exception e) {
            // 回滚 Redis 状态
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
     * 【新增方法】关联订单
     * 订单创建成功后调用此方法，将 orderId 回填到刚才锁定的座位上
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void associateOrder(Long userId, List<Long> seatIds, Long orderId) {
        if (seatIds == null || seatIds.isEmpty())
            return;

        Seat updateParams = new Seat();
        updateParams.setOrderId(orderId);

        // 批量更新：只能更新属于该用户的、状态为锁定(3)的座位
        boolean updated = update(updateParams, Wrappers.<Seat>lambdaUpdate()
                .in(Seat::getSeatId, seatIds)
                .eq(Seat::getUserId, userId) // 安全校验：确保是该用户的锁
                .eq(Seat::getStatus, 3)); // 安全校验：必须是锁定状态

        if (!updated) {
            // 如果更新失败，说明锁过期了或者数据异常，抛出异常回滚订单
            throw new RuntimeException("关联订单失败，座位锁可能已失效或超时");
        }
    }

    /**
     * Mode B：随机锁定一个座位
     * 【优化】移除了查出所有ID再随机的逻辑，改用 count + skip 实现高效随机
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long lockRandomSeat(Long flightId, Long cabinId, Long userId) { // 参数改为 userId
        AircraftCabinConfig cfg = configMapper.selectById(cabinId);
        if (cfg == null)
            throw new IllegalArgumentException("无效的舱位ID");

        int retry = 0;
        while (retry < 5) {
            // 1. 获取该舱位可用座位总数
            long total = count(Wrappers.<Seat>lambdaQuery()
                    .eq(Seat::getFlightId, flightId)
                    .eq(Seat::getCabinType, cfg.getCabinType())
                    .eq(Seat::getStatus, 1));

            if (total == 0)
                throw new InventoryShortageException("抱歉，该航班座位已售罄");

            // 2. 生成随机偏移量
            long offset = ThreadLocalRandom.current().nextLong(total);

            // 3. 获取该偏移量的一个座位 (利用 LIMIT 1 OFFSET X)
            // 注意：last 里的 sql 注入风险，这里 offset 是 long 类型相对安全
            Seat seat = baseMapper.selectOne(Wrappers.<Seat>lambdaQuery()
                    .eq(Seat::getFlightId, flightId)
                    .eq(Seat::getCabinType, cfg.getCabinType())
                    .eq(Seat::getStatus, 1)
                    .last("LIMIT 1 OFFSET " + offset));

            if (seat != null) {
                // 4. 尝试锁定
                seat.setStatus(3);
                seat.setUserId(userId); // 记录用户
                seat.setOrderId(null);

                int rows = baseMapper.updateById(seat); // 乐观锁更新
                if (rows > 0) {
                    try {
                        updateRedisSeatStatus(flightId, seat.getSeatId(), 3);
                    } catch (Exception e) {
                        log.warn("Redis update failed", e);
                    }
                    return seat.getSeatId();
                }
            }
            retry++;
        }
        throw new InventoryShortageException("系统繁忙，锁定座位失败，请重试");
    }

    /**
     * 释放座位
     * 既可以用于主动释放，也可以用于超时释放
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean releaseSeat(Long seatId) {
        Seat seat = baseMapper.selectById(seatId);
        if (seat == null) return false;

        boolean ok = update(null, Wrappers.<Seat>lambdaUpdate()
                .eq(Seat::getSeatId, seatId)
                .set(Seat::getStatus, 1) // 恢复可用
                .set(Seat::getOrderId, null)
                .set(Seat::getUserId, null) // 清空用户
                .set(Seat::getPassengerIndex, null));
        
        if (ok) {
            updateRedisSeatStatus(seat.getFlightId(), seatId, 1);
        }
        return ok;
    }

    /**
     * 确认座位（支付成功后调用）
     * 将 锁定(3) -> 已售(2)
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

    // 换座逻辑保持原样，或者根据新的 UserId 逻辑微调
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
        
        // Update Redis for new seat
        try {
            updateRedisSeatStatus(seat.getFlightId(), newSeatId, 3);
        } catch (Exception e) {
            log.warn("Redis update failed for changeSeat", e);
        }

        if (order.getSeatId() != null && !Objects.equals(order.getSeatId(), newSeatId)) {
            releaseSeat(order.getSeatId());
        }

        // 修复：使用 LambdaUpdateWrapper 仅更新 seatId 和 changeTime，避免更新分片键
        orderMapper.update(null, Wrappers.<com.team.skylink.module.order.entity.Orders>lambdaUpdate()
                .eq(com.team.skylink.module.order.entity.Orders::getOrderId, orderId)
                .set(com.team.skylink.module.order.entity.Orders::getSeatId, newSeatId)
                .set(com.team.skylink.module.order.entity.Orders::getChangeTime, LocalDateTime.now()));

        return true;
    }

    // ... getAvailableCount 和 getAvailableCountBatch 保持不变 ...
    @Override
    public Integer getAvailableCount(Long flightId, String cabinType) {
        return Math.toIntExact(count(Wrappers.<Seat>lambdaQuery()
                .eq(Seat::getFlightId, flightId)
                .eq(Seat::getCabinType, cabinType)
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
     * 补充缺失的单座确认方法
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean confirmSeat(Long seatId, Long orderId) {
        // 将指定 seatId 的座位从 锁定(3) 改为 已售(2)
        // 同时确保 orderId 正确
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

    @Override
    public List<Seat> getSeatMap(Long flightId) {
        String listKey = getSeatListKey(flightId);
        String bitmapKey = getBitmapKey(flightId);

        // 1. Try get List
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

        // 2. Get BitMap Status via Pipeline
        // We need to know the size or iterate the list
        List<Object> results = redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
            for (int i = 0; i < seats.size(); i++) {
                connection.getBit(bitmapKey.getBytes(), i);
            }
            return null;
        });

        // 3. Merge
        for (int i = 0; i < seats.size(); i++) {
            Boolean occupied = (Boolean) results.get(i);
            // 0 -> 1 (Available), 1 -> 2 (Occupied)
            // Note: We lose the distinction between Sold(2) and Locked(3) if we only store 1 bit.
            // But for seat map display, usually "Unavailable" is enough.
            // If needed, we could use 2 bits, but user requested BitMap (0/1).
            seats.get(i).setStatus(occupied ? 2 : 1);
        }
        return seats;
    }

    // Keys
    private String getSeatListKey(Long flightId) { return "flight:" + flightId + ":seats"; }
    private String getBitmapKey(Long flightId) { return "flight:" + flightId + ":bitmap"; }
    private String getSeatIndexKey(Long flightId) { return "flight:" + flightId + ":seat_index"; }

    private void syncSeatMapToRedis(Long flightId) {
        // 1. Load all seats from DB
        List<Seat> seats = baseMapper.selectList(Wrappers.<Seat>lambdaQuery()
                .eq(Seat::getFlightId, flightId)
                .orderByAsc(Seat::getSeatId)); // Ensure consistent order

        if (seats.isEmpty()) return;

        // 2. Cache Structure (List of Seat objects)
        try {
            String json = objectMapper.writeValueAsString(seats);
            redisTemplate.opsForValue().set(getSeatListKey(flightId), json, 1, TimeUnit.HOURS);
        } catch (Exception e) {
            log.error("Failed to cache seat list", e);
        }

        // 3/4. Cache Index Map + BitMap
        // Redis 不可用时不应影响主流程（尤其是测试环境/降级场景）
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
                // Maybe expired or not initialized. Sync.
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
