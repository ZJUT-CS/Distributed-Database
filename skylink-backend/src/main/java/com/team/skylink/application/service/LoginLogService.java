package com.team.skylink.application.service;

public interface LoginLogService {
    void record(String username, boolean success, String reason, String clientIp);
}

