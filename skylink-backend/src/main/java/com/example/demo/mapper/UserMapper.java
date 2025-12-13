package com.example.demo.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Insert;
import com.example.demo.entity.User;
import java.util.List;

@Mapper
public interface UserMapper {

    // 1. 根据ID查询用户
    @Select("SELECT * FROM users WHERE user_id = #{userId}")
    User getUserById(Long userId);

    // 2. 插入新用户 (注意：MyBatis 会自动把下划线 user_id 对应到 Java 的 userId)
    @Insert("INSERT INTO users(user_id, phone_number, password_hash, register_time) " +
            "VALUES(#{userId}, #{phoneNumber}, #{passwordHash}, #{registerTime})")
    int insertUser(User user);
}