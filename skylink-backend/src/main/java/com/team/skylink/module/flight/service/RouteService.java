package com.team.skylink.module.flight.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.team.skylink.module.flight.entity.Route;

import java.util.List;

/**
 * 航线服务接口
 */
public interface RouteService extends IService<Route> {
    /**
     * 根据出发地和目的地查询航线
     *
     * @param departureAirport 出发机场
     * @param arrivalAirport   到达机场
     * @return 航线信息
     */
    Route getByAirports(String departureAirport, String arrivalAirport);

    /**
     * 查询所有航线
     *
     * @return 航线列表
     */
    List<Route> getAllRoutes();
}
