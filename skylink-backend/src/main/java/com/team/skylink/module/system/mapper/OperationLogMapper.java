package com.team.skylink.module.system.mapper;


import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.team.skylink.module.system.entity.SystemLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface OperationLogMapper extends BaseMapper<SystemLog> {}

