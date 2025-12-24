package com.team.skylink.module.flight.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.team.skylink.module.flight.entity.Seat;
import java.util.List;
import java.util.Map;

public interface SeatService extends IService<Seat> {

    // 【修改】参数从 orderId 变成了 userId
    List<Seat> lockSeats(Long flightId, String cabinType, int count, Long userId);

    // 【新增】Impl 里加了这个，接口里也得声明
    void associateOrder(Long userId, List<Long> seatIds, Long orderId);

    // 【修改】参数从 orderId 变成了 userId
    Long lockRandomSeat(Long flightId, Long cabinId, Long userId);

    boolean releaseSeat(Long seatId);

    boolean confirmSeat(Long seatId); // 确保这一行存在

    boolean changeSeat(Long orderId, Long newSeatId);

    boolean confirmSeats(Long orderId);

    boolean releaseSeats(Long orderId);

    Integer getAvailableCount(Long flightId, String cabinType);

    Map<Long, Map<String, Integer>> getAvailableCountBatch(List<Long> flightIds);

    // 以前的批量锁座如果不用了，可以注释掉，或者保留定义
    // void lockSeatsBatch(List<SeatLockRequest> requests);
}