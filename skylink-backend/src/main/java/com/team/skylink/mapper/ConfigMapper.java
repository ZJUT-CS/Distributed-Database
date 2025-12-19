package com.team.skylink.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.team.skylink.entity.SystemConfig;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ConfigMapper extends BaseMapper<SystemConfig> {}

