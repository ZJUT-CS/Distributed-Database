package com.team.skylink.interfaces.controller;

import com.team.skylink.common.Result;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/system")
public class SystemController {
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public SystemController(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }

    @GetMapping("/db/health")
    public Result<String> dbHealth() {
        jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        return Result.ok("ok");
    }

    @GetMapping("/db/test")
    public Result<String> testDb() {
        try (Connection connection = dataSource.getConnection()) {
            String dbUrl = connection.getMetaData().getURL();
            return Result.ok("数据库连接成功，URL: " + dbUrl);
        } catch (SQLException e) {
            throw new RuntimeException("数据库连接失败: " + e.getMessage(), e);
        }
    }
}
