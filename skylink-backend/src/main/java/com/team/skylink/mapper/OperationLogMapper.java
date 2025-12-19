package com.team.skylink.mapper;


import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.team.skylink.entity.SystemLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface OperationLogMapper extends BaseMapper<SystemLog> {}

