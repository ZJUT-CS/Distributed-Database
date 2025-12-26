package com.team.skylink.module.flight.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.team.skylink.module.flight.entity.Lal;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface LalMapper extends BaseMapper<Lal> {
    // MyBatis-Plus 已经内置了基本的 CRUD，通常不需要手写 SQL
}