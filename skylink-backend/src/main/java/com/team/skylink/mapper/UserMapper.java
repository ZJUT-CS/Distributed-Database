package com.team.skylink.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.team.skylink.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {}

