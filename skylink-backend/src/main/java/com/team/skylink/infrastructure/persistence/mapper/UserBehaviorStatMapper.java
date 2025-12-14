package com.team.skylink.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.team.skylink.domain.model.UserBehaviorStat;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserBehaviorStatMapper extends BaseMapper<UserBehaviorStat> {}

