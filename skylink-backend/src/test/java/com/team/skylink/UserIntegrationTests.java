package com.team.skylink;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.aop.support.AopUtils;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import com.team.skylink.module.auth.service.AuthService;
import com.team.skylink.module.auth.service.AuthServiceImpl;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(classes = SkyLinkApplication.class)
public class UserIntegrationTests {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuthService authService;
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

    @Test
    void authServiceWiring() {
        assertNotNull(authService);
        assertEquals(AuthServiceImpl.class, AopUtils.getTargetClass(authService));
    }
}
