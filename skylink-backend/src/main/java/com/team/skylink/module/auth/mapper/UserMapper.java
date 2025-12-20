package com.team.skylink.module.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.team.skylink.module.auth.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {}

