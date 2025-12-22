package com.team.skylink.module.flight.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.team.skylink.common.exception.InventoryShortageException;
import com.team.skylink.module.flight.entity.Seat;
import com.team.skylink.module.flight.mapper.SeatMapper;
import com.team.skylink.module.flight.service.SeatService;
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
                .set(Seat::getUserId, null)
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