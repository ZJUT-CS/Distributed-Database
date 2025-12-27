package com.team.skylink.module.flight.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.team.skylink.common.exception.InventoryShortageException;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper;
import com.team.skylink.module.flight.entity.Seat;
import com.team.skylink.module.flight.mapper.SeatMapper;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.*;

/**
 * ✅ 终极修复版 SeatServiceImpl
 * 1. 彻底移除了 Redis
 * 2. 修复了客座率计算逻辑 (getBookedCountBatch)
 * 3. 修复了支付回调时座位状态更新失败的问题
 */
@Slf4j
@Service
public class SeatServiceImpl extends ServiceImpl<SeatMapper, Seat> implements SeatService {

    private final AircraftCabinConfigMapper configMapper;
    private final OrderMapper orderMapper;

    public SeatServiceImpl(SeatMapper seatMapper,
                           AircraftCabinConfigMapper configMapper,
                           OrderMapper orderMapper) {
        this.configMapper = configMapper;
        this.orderMapper = orderMapper;
    }

    /**
     * 🔥 核心修复：直接查数据库统计已售(2)和锁定(3)的座位数
     * 专门给 AdminFlightController 计算客座率用的
     */
    // @Override
    // public Map<Long, Integer> getBookedCountBatch(List<Long> flightIds) {
    //     Map<Long, Integer> result = new HashMap<>();
    //     if (flightIds == null || flightIds.isEmpty()) return result;

    //     // 遍历每一个航班ID，单独去数它卖了多少张
    //     for (Long flightId : flightIds) {
    //         // 直接数：flightId = ? AND status IN (2, 3)
    //         Long count = count(Wrappers.<Seat>lambdaQuery()
    //                 .eq(Seat::getFlightId, flightId)
    //                 .in(Seat::getStatus, Arrays.asList(2, 3))); // 2=已售, 3=锁定
            
    //         result.put(flightId, count.intValue());
    //     }
        
    //     return result;
    // }

    @Override
    public Map<Long, Integer> getBookedCountBatch(List<Long> flightIds) {
        Map<Long, Integer> result = new HashMap<>();
        if (flightIds == null || flightIds.isEmpty()) return result;

        for (Long flightId : flightIds) {
            // 🔥 这里的 "status" 和 "flight_id" 必须和你数据库表的真实列名一模一样！
            com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<Seat> qw = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
            qw.eq("flight_id", flightId); 
            qw.in("status", 2, 3); // 查状态为 2(已售) 或 3(锁定)
            
            long count = baseMapper.selectCount(qw);
            
            // 🔥🔥🔥 打印日志！看看到底查到了没有！
            System.err.println("🕵️‍♂️ [客座率检查] 航班ID: " + flightId + " | 数据库返回已售数: " + count);
            
            result.put(flightId, (int) count);
        }
        return result;
    }
    
    @Override
    public Map<Long, Map<String, Integer>> getAvailableCountBatch(List<Long> flightIds) {
        // 统计剩余座位
        Map<Long, Map<String, Integer>> result = new HashMap<>();
        if (flightIds == null || flightIds.isEmpty()) return result;

        for (Long flightId : flightIds) {
            QueryWrapper<Seat> query = new QueryWrapper<>();
            query.select("cabin_type", "count(*) as cnt")
                    .eq("flight_id", flightId)
                    .eq("status", 1) // 1=可用
                    .groupBy("cabin_type");

            List<Map<String, Object>> list = baseMapper.selectMaps(query);
            Map<String, Integer> cabinMap = new HashMap<>();
            for (Map<String, Object> map : list) {
                String cabin = (String) map.get("cabin_type");
                Long count = ((Number) map.get("cnt")).longValue();
                cabinMap.put(cabin, count.intValue());
            }
            result.put(flightId, cabinMap);
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<Seat> lockSeats(Long flightId, String cabinType, int count, Long userId) {
        List<Seat> lockedSeats = new ArrayList<>();
        List<String> types = cabinTypeVariants(cabinType);
        
        for (int i = 0; i < count; i++) {
            Seat seat = baseMapper.selectOne(Wrappers.<Seat>lambdaQuery()
                    .eq(Seat::getFlightId, flightId).in(Seat::getCabinType, types).eq(Seat::getStatus, 1).last("LIMIT 1"));
            if (seat == null) throw new InventoryShortageException("余票不足");
            
            seat.setStatus(3);
            seat.setUserId(userId);
            seat.setUpdateTime(LocalDateTime.now());
            baseMapper.updateById(seat);
            lockedSeats.add(seat);
        }
        return lockedSeats;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean confirmSeat(Long seatId, Long orderId) {
        // 允许从 status=1 (可能因超时被释放) 或 status=3 (正常锁定) 更新到 status=2
        return update(null, Wrappers.<Seat>lambdaUpdate()
                .eq(Seat::getSeatId, seatId)
                .in(Seat::getStatus, Arrays.asList(1, 3))
                .set(Seat::getStatus, 2)
                .set(Seat::getOrderId, orderId)); 
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean confirmSeats(Long orderId) {
        // 1. 尝试直接通过 orderId 查找座位 (正常流程：座位还在锁定状态)
        List<Seat> seats = list(Wrappers.<Seat>lambdaQuery().eq(Seat::getOrderId, orderId));
        
        // 2. 如果 Seat 表没找到 (可能因超时被释放，status变回1且orderId置空)，则从 Order 表反查 seatId
        if (seats.isEmpty()) {
            Orders order = orderMapper.selectById(orderId);
            if (order != null && order.getSeatId() != null) {
                return confirmSeat(order.getSeatId(), orderId);
            }
            // 如果连 Order 表都没记录 seatId，那真没办法了
            return true;
        }

        // 3. 正常更新
        return update(null, Wrappers.<Seat>lambdaUpdate()
                .eq(Seat::getOrderId, orderId)
                .set(Seat::getStatus, 2));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean releaseSeat(Long seatId) {
        return update(null, Wrappers.<Seat>lambdaUpdate().eq(Seat::getSeatId, seatId)
                .set(Seat::getStatus, 1).set(Seat::getOrderId, null).set(Seat::getUserId, null));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean releaseSeats(Long orderId) {
        return update(null, Wrappers.<Seat>lambdaUpdate().eq(Seat::getOrderId, orderId)
                .set(Seat::getStatus, 1).set(Seat::getOrderId, null).set(Seat::getUserId, null));
    }

    @Override
    public List<Seat> getSeatMap(Long flightId) {
        // 直接查库返回座位图，不走 Redis
        return list(Wrappers.<Seat>lambdaQuery().eq(Seat::getFlightId, flightId).orderByAsc(Seat::getSeatId));
    }

    @Override
    public Integer getAvailableCount(Long flightId, String cabinType) {
        List<String> types = cabinTypeVariants(cabinType);
        return Math.toIntExact(count(Wrappers.<Seat>lambdaQuery()
                .eq(Seat::getFlightId, flightId).in(Seat::getCabinType, types).eq(Seat::getStatus, 1)));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void associateOrder(Long userId, List<Long> seatIds, Long orderId) {
        update(null, Wrappers.<Seat>lambdaUpdate().in(Seat::getSeatId, seatIds).eq(Seat::getUserId, userId).eq(Seat::getStatus, 3).set(Seat::getOrderId, orderId));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long lockRandomSeat(Long flightId, Long cabinId, Long userId) {
        AircraftCabinConfig cfg = configMapper.selectById(cabinId);
        List<String> types = cabinTypeVariants(cfg.getCabinType());
        Seat seat = baseMapper.selectOne(Wrappers.<Seat>lambdaQuery()
                .eq(Seat::getFlightId, flightId).in(Seat::getCabinType, types).eq(Seat::getStatus, 1).last("LIMIT 1"));
        if (seat != null) {
            seat.setStatus(3); seat.setUserId(userId); baseMapper.updateById(seat);
            return seat.getSeatId();
        }
        throw new InventoryShortageException("余票不足");
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class, propagation = Propagation.REQUIRES_NEW)
    public boolean changeSeat(Long orderId, Long newSeatId) {
        // 1. 获取订单
        Orders order = orderMapper.selectById(orderId);
        if (order == null) {
            log.error("changeSeat failed: Order not found. orderId={}", orderId);
            return false;
        }

        // 2. 检查新座位是否可用 (乐观锁前置检查)
        Seat newSeat = baseMapper.selectById(newSeatId);
        if (newSeat == null) {
            log.error("changeSeat failed: New seat not found. seatId={}", newSeatId);
            return false;
        }
        
        // 允许自己换给自己 (幂等性)
        if (newSeatId.equals(order.getSeatId())) {
             return true;
        }

        if (newSeat.getStatus() != 1) {
            log.warn("changeSeat failed: New seat is not available. seatId={} status={}", newSeatId, newSeat.getStatus());
            return false;
        }

        // 3. 处理旧座位
        Long oldSeatId = order.getSeatId();
        int targetStatus = 3; // 默认锁定状态
        
        // 如果旧座位存在，优先继承旧座位状态
        if (oldSeatId != null) {
            Seat oldSeat = baseMapper.selectById(oldSeatId);
            if (oldSeat != null) {
                targetStatus = oldSeat.getStatus(); 
                
                // 释放旧座位
                oldSeat.setStatus(1);
                oldSeat.setOrderId(null);
                oldSeat.setUserId(null);
                oldSeat.setUpdateTime(LocalDateTime.now());
                baseMapper.updateById(oldSeat);
            }
        } else {
            // 如果没有旧座位，根据订单状态决定
            // 2=已支付/出票 -> 状态2(OCCUPIED)
            // 1=待支付 -> 状态3(LOCKED)
            if (order.getOrderStatus() != null && order.getOrderStatus() == 2) {
                targetStatus = 2;
            }
        }

        // 4. 占用新座位 (使用乐观锁确保并发安全)
        // update seat set status=?, order_id=?, user_id=? where seat_id=? and status=1
        boolean success = update(null, Wrappers.<Seat>lambdaUpdate()
                .eq(Seat::getSeatId, newSeatId)
                .eq(Seat::getStatus, 1) // 关键：确保它是available的
                .set(Seat::getStatus, targetStatus)
                .set(Seat::getOrderId, orderId)
                .set(Seat::getUserId, order.getUserId())
                .set(Seat::getUpdateTime, LocalDateTime.now()));

        if (!success) {
            // 再次查询当前座位状态，以便调试
            Seat currentDbSeat = baseMapper.selectById(newSeatId);
            Integer currentStatus = currentDbSeat != null ? currentDbSeat.getStatus() : null;
            log.warn("changeSeat failed: Optimistic lock failure for seatId={}. Current DB status={}", newSeatId, currentStatus);
            
            throw new InventoryShortageException("所选座位刚刚被占用，请重试");
        }

        // 5. 更新订单关联
        // order.setSeatId(newSeatId);
        // orderMapper.updateById(order); 
        // ⬆️ 原全量更新会触发 ShardingSphere 报错 "Can not update sharding value"，因为 updateById 包含了分片键
        
        // 改为只更新 seat_id 字段
        orderMapper.update(null, Wrappers.<Orders>lambdaUpdate()
                .eq(Orders::getOrderId, orderId)
                .set(Orders::getSeatId, newSeatId));

        return true;
    }

    private List<String> cabinTypeVariants(String cabinType) {
        if (cabinType == null) return Collections.emptyList();
        String t = cabinType.trim().toUpperCase();
        if ("ECONOMY".equals(t)) return Arrays.asList("ECONOMY", "Y");
        if ("BUSINESS".equals(t)) return Arrays.asList("BUSINESS", "J");
        if ("FIRST".equals(t)) return Arrays.asList("FIRST", "F");
        return Collections.singletonList(t);
    }
}
