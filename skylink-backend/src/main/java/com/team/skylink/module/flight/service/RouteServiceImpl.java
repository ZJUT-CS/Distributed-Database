package com.team.skylink.module.flight.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.flight.mapper.RouteMapper;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 航线服务实现
 */
@Service
public class RouteServiceImpl extends ServiceImpl<RouteMapper, Route> implements RouteService {
    private final RouteMapper routeMapper;

    public RouteServiceImpl(RouteMapper routeMapper) {
        this.routeMapper = routeMapper;
    }

    @Override
    public Route getByAirports(String departureAirport, String arrivalAirport) {
        QueryWrapper<Route> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("departure_airport", departureAirport)
                    .eq("arrival_airport", arrivalAirport);
        return routeMapper.selectOne(queryWrapper);
    }

    @Override
    public List<Route> getAllRoutes() {
        return routeMapper.selectList(null);
    }
}
