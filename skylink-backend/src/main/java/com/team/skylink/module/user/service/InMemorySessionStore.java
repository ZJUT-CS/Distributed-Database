package com.team.skylink.module.user.service;

import org.springframework.stereotype.Service;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class InMemorySessionStore implements SessionStore {
    private final ConcurrentHashMap<String, SessionIdentity> sessions = new ConcurrentHashMap<>();

    @Override
    public String createSession(Long userId, Integer userType) {
        String token = UUID.randomUUID().toString();
        sessions.put(token, new SessionIdentity(userId, userType));
        return token;
    }

    @Override
    public SessionIdentity resolve(String token) {
        if (token == null || token.isBlank()) return null;
        return sessions.get(token);
    }
}

