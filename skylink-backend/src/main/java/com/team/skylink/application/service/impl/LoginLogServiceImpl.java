package com.team.skylink.application.service.impl;

import com.team.skylink.application.service.LoginLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LoginLogServiceImpl implements LoginLogService {
    private static final Logger log = LoggerFactory.getLogger(LoginLogServiceImpl.class);

    @Override
    public void record(String username, boolean success, String reason, String clientIp) {
        String status = success ? "SUCCESS" : "FAIL";
        log.info("login {} username={} ip={} reason={}", status, username, clientIp, reason);
    }
}

