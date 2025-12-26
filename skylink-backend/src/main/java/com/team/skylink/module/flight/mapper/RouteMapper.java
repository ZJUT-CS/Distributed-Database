package com.team.skylink.module.flight.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.team.skylink.module.flight.entity.Route;
import org.apache.ibatis.annotations.Mapper;

/**
 * 航线信息表Mapper
 */
@Mapper
public interface RouteMapper extends BaseMapper<Route> {
}
