package com.team.skylink.application.service.impl;

import com.team.skylink.application.service.LoginLogService;
import com.team.skylink.domain.model.User;
import com.team.skylink.domain.repository.UserRepository;
import com.team.skylink.interfaces.dto.LoginRequest;
import com.team.skylink.interfaces.dto.LoginResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceImplTest {
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private LoginLogService loginLogService;
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        loginLogService = mock(LoginLogService.class);
        authService = new AuthServiceImpl(userRepository, passwordEncoder, loginLogService);
    }

    @Test
    void loginSuccess() {
        LoginRequest request = new LoginRequest();
        request.setUsername("User_01");
        request.setPassword("Aa123456");
        User user = new User();
        user.setId(1L);
        user.setUsername("User_01");
        user.setEmail("test@example.com");
        user.setPasswordHash("hash");
        user.setLocked(false);
        user.setFailedAttempts(0);
        user.setLockUntil(null);
        when(userRepository.findByUsername("User_01")).thenReturn(user);
        when(passwordEncoder.matches("Aa123456", "hash")).thenReturn(true);
        LoginResponse response = authService.login(request, "127.0.0.1");
        assertNotNull(response.getAccessToken());
        assertNotNull(response.getRefreshToken());
        assertEquals(1L, response.getUser().getId());
        assertEquals("User_01", response.getUser().getUsername());
        verify(userRepository).update(user);
        verify(loginLogService).record("User_01", true, "Success", "127.0.0.1");
    }

    @Test
    void loginInvalidUsername() {
        LoginRequest request = new LoginRequest();
        request.setUsername("Unknown_1");
        request.setPassword("Aa123456");
        when(userRepository.findByUsername("Unknown_1")).thenReturn(null);
        AuthServiceImpl.LoginException ex = assertThrows(AuthServiceImpl.LoginException.class,
                () -> authService.login(request, "127.0.0.1"));
        assertEquals("Invalid username", ex.getMessage());
        verify(loginLogService).record("Unknown_1", false, "Invalid username", "127.0.0.1");
    }

    @Test
    void loginInvalidPasswordIncrementsAttempts() {
        LoginRequest request = new LoginRequest();
        request.setUsername("User_02");
        request.setPassword("Aa123456");
        User user = new User();
        user.setId(2L);
        user.setUsername("User_02");
        user.setEmail("test2@example.com");
        user.setPasswordHash("hash2");
        user.setLocked(false);
        user.setFailedAttempts(0);
        user.setLockUntil(null);
        when(userRepository.findByUsername("User_02")).thenReturn(user);
        when(passwordEncoder.matches("Aa123456", "hash2")).thenReturn(false);
        AuthServiceImpl.LoginException ex = assertThrows(AuthServiceImpl.LoginException.class,
                () -> authService.login(request, "127.0.0.1"));
        assertEquals("Invalid password", ex.getMessage());
        assertEquals(1, user.getFailedAttempts());
        verify(userRepository).update(user);
        verify(loginLogService).record("User_02", false, "Invalid password", "127.0.0.1");
    }

    @Test
    void loginLocksAfterMaxFailures() {
        LoginRequest request = new LoginRequest();
        request.setUsername("User_03");
        request.setPassword("Aa123456");
        User user = new User();
        user.setId(3L);
        user.setUsername("User_03");
        user.setEmail("test3@example.com");
        user.setPasswordHash("hash3");
        user.setLocked(false);
        user.setFailedAttempts(0);
        user.setLockUntil(null);
        when(userRepository.findByUsername("User_03")).thenReturn(user);
        when(passwordEncoder.matches("Aa123456", "hash3")).thenReturn(false);
        for (int i = 0; i < 5; i++) {
            assertThrows(AuthServiceImpl.LoginException.class,
                    () -> authService.login(request, "127.0.0.1"));
        }
        assertEquals(5, user.getFailedAttempts());
        verify(userRepository, times(5)).update(user);
        verify(loginLogService, times(5))
                .record("User_03", false, "Invalid password", "127.0.0.1");
        assertEquals(Boolean.TRUE, user.getLocked());
        assertNotNull(user.getLockUntil());
    }

    @Test
    void loginFailsWhenCachedLocked() {
        LoginRequest request = new LoginRequest();
        request.setUsername("User_04");
        request.setPassword("Aa123456");
        User user = new User();
        user.setId(4L);
        user.setUsername("User_04");
        user.setEmail("test4@example.com");
        user.setPasswordHash("hash4");
        user.setLocked(false);
        user.setFailedAttempts(0);
        user.setLockUntil(null);
        when(userRepository.findByUsername("User_04")).thenReturn(user);
        when(passwordEncoder.matches("Aa123456", "hash4")).thenReturn(false);
        for (int i = 0; i < 5; i++) {
            assertThrows(AuthServiceImpl.LoginException.class,
                    () -> authService.login(request, "127.0.0.1"));
        }
        when(passwordEncoder.matches("Aa123456", "hash4")).thenReturn(true);
        AuthServiceImpl.LoginException ex = assertThrows(AuthServiceImpl.LoginException.class,
                () -> authService.login(request, "127.0.0.1"));
        assertEquals("Account locked", ex.getMessage());
        verify(loginLogService, Mockito.atLeastOnce())
                .record(eq("User_04"), eq(false), eq("Account locked"), eq("127.0.0.1"));
    }

    @Test
    void loginFailsWhenUserMarkedLocked() {
        LoginRequest request = new LoginRequest();
        request.setUsername("User_05");
        request.setPassword("Aa123456");
        User user = new User();
        user.setId(5L);
        user.setUsername("User_05");
        user.setEmail("test5@example.com");
        user.setPasswordHash("hash5");
        user.setLocked(true);
        user.setFailedAttempts(5);
        user.setLockUntil(System.currentTimeMillis() + 600000);
        when(userRepository.findByUsername("User_05")).thenReturn(user);
        AuthServiceImpl.LoginException ex = assertThrows(AuthServiceImpl.LoginException.class,
                () -> authService.login(request, "127.0.0.1"));
        assertEquals("Account locked", ex.getMessage());
        verify(loginLogService).record("User_05", false, "Account locked", "127.0.0.1");
    }
}

