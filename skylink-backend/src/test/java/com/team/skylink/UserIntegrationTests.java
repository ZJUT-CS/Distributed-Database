package com.team.skylink;

import com.team.skylink.infrastructure.persistence.mapper.UserMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(classes = SkyLinkApplication.class)
public class UserIntegrationTests {
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private UserMapper userMapper;

    @Test
    void dbHealth() {
        Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        assertNotNull(one);
    }

    @Test
    void userCount() {
        Long cnt = userMapper.selectCount(null);
        assertTrue(cnt >= 0);
    }
}

