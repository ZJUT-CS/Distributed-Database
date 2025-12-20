package com.team.skylink.module.auth.service;

public interface SessionStore {
    String createSession(Long userId, Integer userType);

    SessionIdentity resolve(String token);
}

