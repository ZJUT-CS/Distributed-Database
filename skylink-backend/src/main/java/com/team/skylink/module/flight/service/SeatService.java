package com.team.skylink.module.flight.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.team.skylink.module.flight.entity.Seat;

/**
 * 座位服务接口
 * 继承 IService 以获得 saveBatch 等批量操作能力
 */
public interface SeatService extends IService<Seat> {
}