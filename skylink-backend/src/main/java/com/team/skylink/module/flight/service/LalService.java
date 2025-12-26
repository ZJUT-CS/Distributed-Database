package com.team.skylink.module.flight.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.team.skylink.module.flight.entity.Lal;
import java.util.List;

public interface LalService extends IService<Lal> {
    // 获取所有机场坐标信息
    List<Lal> getAllAirports();
}