package com.team.skylink.module.system.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@RestController
@RequestMapping("/api/v1/system")
public class DbTestController {
    private final DataSource dataSource;

    public DbTestController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    public String hello() {
        return "Hello, SkyLink";
    }

    @GetMapping("/db-connection")
    public String testDb() {
        try (Connection connection = dataSource.getConnection()) {
            String dbUrl = connection.getMetaData().getURL();
            return "恭喜！数据库连接成功。连接地址是: " + dbUrl;
        } catch (SQLException e) {
            return "遗憾，数据库连接失败。错误信息: " + e.getMessage();
        }
    }
}

