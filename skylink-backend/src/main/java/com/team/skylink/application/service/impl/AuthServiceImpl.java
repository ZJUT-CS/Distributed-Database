package com.team.skylink.application.service.impl;

import com.team.skylink.application.service.AuthService;
import com.team.skylink.application.service.LoginLogService;
import com.team.skylink.domain.model.User;
import com.team.skylink.domain.repository.UserRepository;
import com.team.skylink.interfaces.dto.LoginRequest;
import com.team.skylink.interfaces.dto.LoginResponse;
import com.team.skylink.interfaces.dto.UserBasicInfo;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MILLIS = TimeUnit.MINUTES.toMillis(30);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoginLogService loginLogService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final ConcurrentHashMap<String, Long> lockedUntilCache = new ConcurrentHashMap<>();

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, LoginLogService loginLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.loginLogService = loginLogService;
    }

    @Override
    public LoginResponse login(LoginRequest request, String clientIp) {
        String username = request.getUsername();
        if (isLocked(username)) {
            loginLogService.record(username, false, "Account locked", clientIp);
            throw new LoginException("Account locked");
        }
        User user = userRepository.findByUsername(username);
        if (user == null) {
            loginLogService.record(username, false, "Invalid username", clientIp);
            throw new LoginException("Invalid username");
        }
        if (Boolean.TRUE.equals(user.getLocked()) && isLockedByUser(user)) {
            lockInCache(username, user.getLockUntil());
            loginLogService.record(username, false, "Account locked", clientIp);
            throw new LoginException("Account locked");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            handleFailedAttempt(user);
            loginLogService.record(username, false, "Invalid password", clientIp);
            throw new LoginException("Invalid password");
        }
        resetAttempts(user);
        String accessToken = generateToken();
        String refreshToken = generateToken();
        LoginResponse response = new LoginResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        UserBasicInfo info = new UserBasicInfo();
        info.setId(user.getId());
        info.setUsername(user.getUsername());
        info.setEmail(user.getEmail());
        response.setUser(info);
        loginLogService.record(username, true, "Success", clientIp);
        return response;
    }

    private boolean isLocked(String username) {
        Long until = lockedUntilCache.get(username);
        if (until == null) {
            return false;
        }
        if (until <= Instant.now().toEpochMilli()) {
            lockedUntilCache.remove(username);
            return false;
        }
        return true;
    }

    private boolean isLockedByUser(User user) {
        Long until = user.getLockUntil();
        if (until == null) {
            return false;
        }
        long now = Instant.now().toEpochMilli();
        return until > now;
    }

    private void handleFailedAttempt(User user) {
        Integer count = user.getFailedAttempts();
        int newCount = count == null ? 1 : count + 1;
        user.setFailedAttempts(newCount);
        if (newCount >= MAX_FAILED_ATTEMPTS) {
            long until = Instant.now().toEpochMilli() + LOCK_DURATION_MILLIS;
            user.setLocked(true);
            user.setLockUntil(until);
            lockInCache(user.getUsername(), until);
        }
        userRepository.update(user);
    }

    private void resetAttempts(User user) {
        user.setFailedAttempts(0);
        user.setLocked(false);
        user.setLockUntil(null);
        userRepository.update(user);
        lockedUntilCache.remove(user.getUsername());
    }

    private void lockInCache(String username, Long until) {
        if (until != null) {
            lockedUntilCache.put(username, until);
        }
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static class LoginException extends RuntimeException {
        public LoginException(String message) {
            super(message);
        }
    }
}
