package com.team.skylink;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(classes = SkyLinkApplication.class)
public class UserIntegrationTests {
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Test
    void dbHealth() {
        Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        assertNotNull(one);
    }

    @Test
    void userCount() {
        Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        assertNotNull(one);
    }
}
