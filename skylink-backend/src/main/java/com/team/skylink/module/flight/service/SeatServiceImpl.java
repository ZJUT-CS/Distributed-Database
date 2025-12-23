package com.team.skylink.module.flight.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.team.skylink.common.exception.InventoryShortageException;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper;
import com.team.skylink.module.flight.entity.Seat;
import com.team.skylink.module.flight.mapper.SeatMapper;
import com.team.skylink.module.flight.service.SeatService;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 座位服务实现类
 * 必须继承 ServiceImpl 并加上 @Service 注解
 */
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
public class SeatServiceImpl extends ServiceImpl<SeatMapper, Seat> implements SeatService {
    private final AircraftCabinConfigMapper configMapper;
    private final OrderMapper orderMapper;

    public SeatServiceImpl(SeatMapper seatMapper,
                           AircraftCabinConfigMapper configMapper,
                           OrderMapper orderMapper) {
        // ServiceImpl 已持有 baseMapper，无需显式保存 seatMapper
        this.configMapper = configMapper;
        this.orderMapper = orderMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<Seat> lockSeats(Long flightId, String cabinType, int count, Long orderId) {
        List<Seat> lockedSeats = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            boolean success = false;
            int retry = 0;
            while (!success && retry < 10) { // 最多重试10次
                // 随机取一个可用座位，避免热点竞争 (利用 LIMIT 1 OFFSET X? 或者只是 LIMIT 1)
                // 简单起见，直接取第一个。因为如果竞争失败，状态变了，下一次查询自然会取下一个。
                Seat seat = baseMapper.selectOne(Wrappers.<Seat>lambdaQuery()
                        .eq(Seat::getFlightId, flightId)
                        .eq(Seat::getCabinType, cabinType)
                        .eq(Seat::getStatus, 1)
                        .last("LIMIT 1"));

                if (seat == null) {
                    throw new InventoryShortageException("余票不足 (" + cabinType + ")");
                }

                seat.setStatus(3); // 3-锁定
                seat.setOrderId(orderId);
                
                // MyBatis-Plus 的 updateById 会检查 @Version 字段
                int rows = baseMapper.updateById(seat);
                if (rows > 0) {
                    success = true;
                    lockedSeats.add(seat);
                } else {
                    retry++;
                }
            }
            if (!success) {
                throw new InventoryShortageException("系统繁忙，锁定座位失败，请重试");
            }
        }
        return lockedSeats;
    }

    /**
     * Mode B：随机锁定一个座位
     * 并发控制说明：
     * - 使用数据库行级排他锁：ORDER BY RAND() LIMIT 1 FOR UPDATE 选取可用座位
     * - 方法开启事务，避免锁释放前被其他事务抢占
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long lockRandomSeat(Long flightId, Long cabinId, Long orderId) {
        AircraftCabinConfig cfg = configMapper.selectById(cabinId);
        if (cfg == null) {
            throw new IllegalArgumentException("invalid cabinId");
        }
        int retry = 0;
        while (retry < 10) {
            // 1. 查出所有可用座位ID
            List<Seat> availableSeats = baseMapper.selectList(Wrappers.<Seat>lambdaQuery()
                    .select(Seat::getSeatId)
                    .eq(Seat::getFlightId, flightId)
                    .eq(Seat::getCabinType, cfg.getCabinType())
                    .eq(Seat::getStatus, 1));
            
            if (availableSeats.isEmpty()) {
                throw new InventoryShortageException("no available seat");
            }

            // 2. 随机选一个
            int idx = java.util.concurrent.ThreadLocalRandom.current().nextInt(availableSeats.size());
            Long targetSeatId = availableSeats.get(idx).getSeatId();

            // 3. 尝试锁定 (乐观锁)
            Seat seat = baseMapper.selectById(targetSeatId);
            if (seat != null && seat.getStatus() == 1) {
                seat.setStatus(3);
                seat.setOrderId(orderId);
                seat.setPassengerIndex(0);
                int rows = baseMapper.updateById(seat);
                if (rows > 0) {
                    return seat.getSeatId();
                }
            }
            retry++;
        }
        throw new InventoryShortageException("系统繁忙，锁定座位失败，请重试");
    }

    /**
     * Mode B：释放单个座位
     * - 无需关联订单ID，直接按 seatId 将状态置回可用
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean releaseSeat(Long seatId) {
        return update(null, Wrappers.<Seat>lambdaUpdate()
                .eq(Seat::getSeatId, seatId)
                .set(Seat::getStatus, 1)
                .set(Seat::getOrderId, null)
                .set(Seat::getPassengerIndex, null));
    }

    /**
     * Mode B：确认单个座位
     * - 将锁定(3)座位置为已售(2)
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean confirmSeat(Long seatId) {
        return update(null, Wrappers.<Seat>lambdaUpdate()
                .eq(Seat::getSeatId, seatId)
                .eq(Seat::getStatus, 3)
                .set(Seat::getStatus, 2));
    }

    /**
     * Mode B：支付后换座（事务）
     * 并发控制说明：
     * - 先释放旧座位，再尝试将新座位从可用(1)原子更新为已售(2)
     * - WHERE 条件包含 status=1，若被他人占用将更新失败并抛出异常
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean changeSeat(Long orderId, Long newSeatId) {
        Orders order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new IllegalArgumentException("order not found");
        }
        Long oldSeatId = order.getSeatId();
        if (oldSeatId != null) {
            releaseSeat(oldSeatId);
        }
        boolean updated = update(null, Wrappers.<Seat>lambdaUpdate()
                .eq(Seat::getSeatId, newSeatId)
                .eq(Seat::getStatus, 1)
                .set(Seat::getStatus, 2)
                .set(Seat::getOrderId, orderId));
        if (!updated) {
            throw new RuntimeException("seat occupied");
        }
        order.setSeatId(newSeatId);
        orderMapper.updateById(order);
        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean confirmSeats(Long orderId) {
        // 将该订单下所有锁定(3)的座位改为已售(2)
        // 注意：这里不需要乐观锁版本检查，因为是我们自己持有的订单
        // 但为了安全，可以用 update(entity, updateWrapper)
        Seat updateParams = new Seat();
        updateParams.setStatus(2);
        
        return update(updateParams, Wrappers.<Seat>lambdaUpdate()
                .eq(Seat::getOrderId, orderId)
                .eq(Seat::getStatus, 3));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean releaseSeats(Long orderId) {
        // 将该订单下所有座位释放：状态->1，清空OrderId
        // update(null, wrapper) set status=1, order_id=null ...
        return update(null, Wrappers.<Seat>lambdaUpdate()
                .eq(Seat::getOrderId, orderId)
                .set(Seat::getStatus, 1)
                .set(Seat::getOrderId, null)
                .set(Seat::getPassengerIndex, null));
    }

    @Override
    public Integer getAvailableCount(Long flightId, String cabinType) {
        return Math.toIntExact(count(Wrappers.<Seat>lambdaQuery()
                .eq(Seat::getFlightId, flightId)
                .eq(Seat::getCabinType, cabinType)
                .eq(Seat::getStatus, 1)));
    }

    @Override
    public Map<Long, Map<String, Integer>> getAvailableCountBatch(List<Long> flightIds) {
        if (flightIds == null || flightIds.isEmpty()) {
            return Collections.emptyMap();
        }
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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void lockSeatsBatch(List<SeatLockRequest> requests) {
        // 1. 按航班ID升序排序，防止死锁
        requests.sort(SeatLockRequest::compareTo);

        // 2. 依次加锁并扣减
        for (SeatLockRequest req : requests) {
            // 使用 SELECT FOR UPDATE 悲观锁获取指定数量的座位
            List<Seat> seats = baseMapper.selectAvailableSeatsForUpdate(req.getFlightId(), req.getCabinType(), req.getCount());

            if (seats.size() < req.getCount()) {
                throw new InventoryShortageException("航班 " + req.getFlightId() + " (" + req.getCabinType() + ") 余票不足");
            }

            // 更新状态
            for (Seat seat : seats) {
                seat.setStatus(3); // 锁定
                seat.setOrderId(req.getOrderId());
                // updateById 会自动处理 @Version 乐观锁版本号递增
                baseMapper.updateById(seat);
            }
        }
    }
}
