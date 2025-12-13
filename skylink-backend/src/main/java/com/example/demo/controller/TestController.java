package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.demo.mapper.UserMapper;
import com.example.demo.entity.User;

@RestController
public class TestController {

    @Autowired
    UserMapper userMapper;

    @GetMapping("/test/user")
    public String testUser() {
        // 这里假设数据库里已经有一条 user_id = 1 的数据
        // 如果没有，你可能需要先手动 insert 一条，或者写一个 insert 接口
        User user = userMapper.getUserById(1L); 
        
        if (user != null) {
            return "查找到用户：" + user.getPhoneNumber();
        } else {
            return "连接成功，但未找到ID为1的用户";
        }
    }
}