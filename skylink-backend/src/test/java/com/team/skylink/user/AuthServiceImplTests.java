package com.team.skylink.user;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.module.user.dto.LoginRequest;
import com.team.skylink.module.user.dto.LoginResponse;
import com.team.skylink.module.user.entity.User;
import com.team.skylink.module.user.mapper.UserMapper;
import com.team.skylink.module.user.service.AuthServiceImpl;
import com.team.skylink.module.user.service.SessionStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;

public class AuthServiceImplTests {
    private UserMapper userMapper;
    private PasswordEncoder passwordEncoder;
    private SessionStore sessionStore;
    private AuthServiceImpl service;

    @BeforeEach
    void setup() {
        userMapper = Mockito.mock(UserMapper.class);
        passwordEncoder = Mockito.mock(PasswordEncoder.class);
        sessionStore = Mockito.mock(SessionStore.class);
        service = new AuthServiceImpl(userMapper, passwordEncoder, sessionStore);
    }

    @Test
    void login_success() {
        LoginRequest req = new LoginRequest();
        req.setPhoneNumber("13800000000");
        req.setPassword("pwd");
        User u = new User();
        u.setUserId(1L);
        u.setPhoneNumber("13800000000");
        u.setPasswordHash("hash");
        u.setUserStatus(1);
        Mockito.when(userMapper.selectOne(any(QueryWrapper.class))).thenReturn(u);
        Mockito.when(passwordEncoder.matches(eq("pwd"), eq("hash"))).thenReturn(true);
        Mockito.when(sessionStore.createSession(eq(1L), eq(1))).thenReturn("token-1");
        Result<LoginResponse> r = service.login(req);
        assertEquals(0, r.getCode());
        assertEquals("user", r.getData().getRole());
        assertEquals("token-1", r.getData().getToken());
    }

    @Test
    void login_invalid_phone() {
        LoginRequest req = new LoginRequest();
        req.setPhoneNumber("13900000000");
        req.setPassword("pwd");
        Mockito.when(userMapper.selectOne(any(QueryWrapper.class))).thenReturn(null);
        Result<LoginResponse> r = service.login(req);
        assertEquals(401, r.getCode());
    }

    @Test
    void login_invalid_password() {
        LoginRequest req = new LoginRequest();
        req.setPhoneNumber("13800000000");
        req.setPassword("bad");
        User u = new User();
        u.setUserId(1L);
        u.setPhoneNumber("13800000000");
        u.setPasswordHash("hash");
        u.setUserStatus(1);
        Mockito.when(userMapper.selectOne(any(QueryWrapper.class))).thenReturn(u);
        Mockito.when(passwordEncoder.matches(eq("bad"), eq("hash"))).thenReturn(false);
        Result<LoginResponse> r = service.login(req);
        assertEquals(401, r.getCode());
    }

    @Test
    void login_disabled_user() {
        LoginRequest req = new LoginRequest();
        req.setPhoneNumber("13800000000");
        req.setPassword("pwd");
        User u = new User();
        u.setUserId(1L);
        u.setPhoneNumber("13800000000");
        u.setPasswordHash("hash");
        u.setUserStatus(0);
        Mockito.when(userMapper.selectOne(any(QueryWrapper.class))).thenReturn(u);
        Mockito.when(passwordEncoder.matches(eq("pwd"), eq("hash"))).thenReturn(true);
        Result<LoginResponse> r = service.login(req);
        assertEquals(423, r.getCode());
    }

    @Test
    void phoneRegister_success() {
        Map<String,String> body = new HashMap<>();
        body.put("phoneNumber","13800000001");
        body.put("password","pwd123");
        body.put("gender","1");
        Mockito.when(userMapper.selectOne(any(QueryWrapper.class))).thenReturn(null);
        Mockito.when(userMapper.insert(any(User.class))).thenReturn(1);
        Mockito.when(passwordEncoder.encode(eq("pwd123"))).thenReturn("hash");
        Result<Boolean> r = service.phoneRegister(body);
        assertEquals(0, r.getCode());
        assertTrue(r.getData());
    }

    @Test
    void phoneRegister_conflict() {
        Map<String,String> body = new HashMap<>();
        body.put("phoneNumber","13800000001");
        body.put("password","pwd123");
        User exists = new User();
        exists.setUserId(2L);
        Mockito.when(userMapper.selectOne(any(QueryWrapper.class))).thenReturn(exists);
        Result<Boolean> r = service.phoneRegister(body);
        assertEquals(409, r.getCode());
    }

    @Test
    void phoneRegister_invalidGender() {
        Map<String,String> body = new HashMap<>();
        body.put("phoneNumber","13800000001");
        body.put("password","pwd123");
        body.put("gender","abc");
        Mockito.when(userMapper.selectOne(any(QueryWrapper.class))).thenReturn(null);
        Result<Boolean> r = service.phoneRegister(body);
        assertEquals(400, r.getCode());
    }

    @Test
    void getUserById_notFound() {
        Mockito.when(userMapper.selectById(eq(99L))).thenReturn(null);
        Result<User> r = service.getUserById(99L);
        assertEquals(404, r.getCode());
    }

    @Test
    void updateProfile_success() {
        User u = new User();
        u.setUserId(1L);
        Mockito.when(userMapper.selectById(eq(1L))).thenReturn(u);
        Mockito.when(userMapper.updateById(any(User.class))).thenReturn(1);
        Result<User> r = service.updateProfile(1L, "a@b.com", "https://img", 1, null, null);
        assertEquals(0, r.getCode());
        assertEquals(1L, r.getData().getUserId());
    }

    @Test
    void updateProfile_invalidAvatar() {
        User u = new User();
        u.setUserId(1L);
        Mockito.when(userMapper.selectById(eq(1L))).thenReturn(u);
        Result<User> r = service.updateProfile(1L, null, "ftp://bad", null, null, null);
        assertEquals(400, r.getCode());
    }

    @Test
    void updateProfile_invalidEmail() {
        User u = new User();
        u.setUserId(1L);
        Mockito.when(userMapper.selectById(eq(1L))).thenReturn(u);
        Result<User> r = service.updateProfile(1L, "bad@", null, null, null, null);
        assertEquals(400, r.getCode());
    }

    @Test
    void updateProfile_verifyRules() {
        User u = new User();
        u.setUserId(1L);
        u.setIdCard("EXIST");
        Mockito.when(userMapper.selectById(eq(1L))).thenReturn(u);
        Result<User> r = service.updateProfile(1L, null, null, null, "name", "id");
        assertEquals(409, r.getCode());
    }

    @Test
    void bindEmail_success() {
        User u = new User();
        u.setUserId(1L);
        Mockito.when(userMapper.selectById(eq(1L))).thenReturn(u);
        Mockito.when(userMapper.updateById(any(User.class))).thenReturn(1);
        Result<User> r = service.bindEmail(1L, "a@b.com", "123456");
        assertEquals(0, r.getCode());
    }

    @Test
    void bindPhone_conflict() {
        Mockito.when(userMapper.selectOne(any(QueryWrapper.class))).thenReturn(new User());
        Result<User> r = service.bindPhone(1L, "13800000000", "123456");
        assertEquals(409, r.getCode());
    }

    @Test
    void bindPhone_invalid() {
        Result<User> r = service.bindPhone(1L, "123", "123456");
        assertEquals(400, r.getCode());
    }

    @Test
    void changePassword_success() {
        User u = new User();
        u.setUserId(1L);
        u.setPasswordHash("hash");
        Mockito.when(userMapper.selectById(eq(1L))).thenReturn(u);
        Mockito.when(passwordEncoder.matches(eq("old"), eq("hash"))).thenReturn(true);
        Mockito.when(passwordEncoder.encode(eq("newpwd"))).thenReturn("newhash");
        Mockito.when(userMapper.updateById(any(User.class))).thenReturn(1);
        Result<Boolean> r = service.changePassword(1L, "old", "newpwd");
        assertEquals(0, r.getCode());
        assertTrue(r.getData());
    }

    @Test
    void changePassword_invalidOld() {
        User u = new User();
        u.setUserId(1L);
        u.setPasswordHash("hash");
        Mockito.when(userMapper.selectById(eq(1L))).thenReturn(u);
        Mockito.when(passwordEncoder.matches(eq("bad"), eq("hash"))).thenReturn(false);
        Result<Boolean> r = service.changePassword(1L, "bad", "newpwd");
        assertEquals(401, r.getCode());
    }
}

