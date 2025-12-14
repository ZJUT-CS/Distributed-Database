package com.team.skylink.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.team.skylink.domain.model.ChangeRequest;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ChangeRequestMapper extends BaseMapper<ChangeRequest> {}

