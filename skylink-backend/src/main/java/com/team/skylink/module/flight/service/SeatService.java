package com.team.skylink.module.flight.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.team.skylink.module.flight.entity.Seat;
import java.util.List;

/**
 * 座位服务接口
 * 继承 IService 以获得 saveBatch 等批量操作能力
 */
public interface SeatService extends IService<Seat> {

    /**
     * 锁定座位 (乐观锁)
     * @param flightId 航班ID
     * @param cabinType 舱位类型
     * @param count 数量
     * @param orderId 订单ID
     * @return 锁定的座位列表
     */
    List<Seat> lockSeats(Long flightId, String cabinType, int count, Long orderId);

    /**
     * 确认座位 (支付成功后)
     * @param orderId 订单ID
     * @return 是否成功
     */
    boolean confirmSeats(Long orderId);

    /**
     * 释放座位 (取消订单/退票)
     * @param orderId 订单ID
     * @return 是否成功
     */
    boolean releaseSeats(Long orderId);

    /**
     * 获取可用座位数
     * @param flightId 航班ID
     * @param cabinType 舱位类型
     * @return 可用数
     */
    Integer getAvailableCount(Long flightId, String cabinType);

    /**
     * 批量获取可用座位数
     * @param flightIds 航班ID列表
     * @return Map<FlightId, Map<CabinType, Count>>
     */
    java.util.Map<Long, java.util.Map<String, Integer>> getAvailableCountBatch(List<Long> flightIds);

    /**
     * 批量锁定座位 (联程航班专用 - 悲观锁 + 排序防死锁)
     * @param requests 锁定请求列表
     */
    void lockSeatsBatch(List<SeatLockRequest> requests);

    @lombok.Data
    class SeatLockRequest implements Comparable<SeatLockRequest> {
        private Long flightId;
        private String cabinType;
        private int count;
        private Long orderId;

        @Override
        public int compareTo(SeatLockRequest o) {
            return this.flightId.compareTo(o.flightId);
        }
    }
}