package com.team.skylink.module.flight.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.team.skylink.module.flight.entity.Seat;
import com.team.skylink.module.flight.mapper.SeatMapper;
import com.team.skylink.module.flight.service.SeatService;
import org.springframework.stereotype.Service;

/**
 * 座位服务实现类
 * 必须继承 ServiceImpl 并加上 @Service 注解
 */
@Service
public class SeatServiceImpl extends ServiceImpl<SeatMapper, Seat> implements SeatService {
}