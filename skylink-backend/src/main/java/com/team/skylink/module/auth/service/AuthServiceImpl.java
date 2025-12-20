package com.team.skylink.module.auth.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.entity.Admin;
import com.team.skylink.module.admin.mapper.AdminMapper;
import com.team.skylink.module.auth.dto.AdminLoginRequest;
import com.team.skylink.module.auth.dto.AdminRegisterRequest;
import com.team.skylink.module.auth.dto.LoginRequest;
import com.team.skylink.module.auth.dto.LoginResponse;
import com.team.skylink.module.auth.entity.User;
import com.team.skylink.module.auth.mapper.UserMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class AuthServiceImpl implements AuthService {
    private final UserMapper userMapper;
    private final AdminMapper adminMapper;
    private final PasswordEncoder passwordEncoder;
    private final SessionStore sessionStore;

    public AuthServiceImpl(UserMapper userMapper, AdminMapper adminMapper, PasswordEncoder passwordEncoder, SessionStore sessionStore) {
        this.userMapper = userMapper;
        this.adminMapper = adminMapper;
        this.passwordEncoder = passwordEncoder;
        this.sessionStore = sessionStore;
    }

    @Override
    public Result<LoginResponse> login(LoginRequest request) {
        String phoneNumber = request.getPhoneNumber();
        String password = request.getPassword();

        User user = userMapper.selectOne(new QueryWrapper<User>().eq("phone_number", phoneNumber));
        if (user == null) {
            return Result.fail(401, "invalid phoneNumber");
        }

        if (user.getPasswordHash() == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            return Result.fail(401, "invalid password");
        }

        if (user.getUserStatus() != null && user.getUserStatus() != 1) {
            return Result.fail(423, "user is disabled");
        }

        String token = sessionStore.createSession(user.getUserId(), 1);
        LoginResponse resp = new LoginResponse(
                user.getUserId(),
                user.getPhoneNumber(),
                "user",
                token
        );
        return Result.ok(resp);
    }

    @Override
    public Result<LoginResponse> adminLogin(AdminLoginRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();

        Admin admin = adminMapper.selectOne(new QueryWrapper<Admin>().eq("admin_account", username));
        if (admin == null) {
            return Result.fail(401, "invalid username");
        }

        if (admin.getPasswordHash() == null || !passwordEncoder.matches(password, admin.getPasswordHash())) {
            return Result.fail(401, "invalid password");
        }

        long now = System.currentTimeMillis();
        admin.setLastLoginTime(now);
        adminMapper.updateById(admin);

        String token = sessionStore.createSession(admin.getAdminId(), 2);
        LoginResponse resp = new LoginResponse(
                admin.getAdminId(),
                admin.getAdminAccount(),
                "admin",
                token
        );
        return Result.ok(resp);
    }

    @Override
    public Result<Boolean> adminRegister(AdminRegisterRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();
        Integer role = request.getRole();

        Admin existing = adminMapper.selectOne(new QueryWrapper<Admin>().eq("admin_account", username));
        if (existing != null) {
            return Result.fail(409, "username already exists");
        }

        Admin admin = new Admin();
        admin.setAdminAccount(username);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole(role != null ? role : 1);
        long now = System.currentTimeMillis();
        admin.setCreateTime(now);
        admin.setLastLoginTime(now);

        int rows = adminMapper.insert(admin);
        return Result.ok(rows > 0);
    }

    @Override
    public Result<Boolean> phoneRegister(Map<String, String> body) {
        String phoneNumber = body.get("phoneNumber");
        String password = body.get("password");
        String realName = body.get("realName");
        String email = body.get("email");
        String idCard = body.get("idCard");
        String genderStr = body.get("gender");

        if (phoneNumber == null || password == null) {
            return Result.fail(400, "missing phoneNumber or password");
        }

        User existing = userMapper.selectOne(
                new QueryWrapper<User>().eq("phone_number", phoneNumber));
        if (existing != null) {
            return Result.fail(409, "phone number already registered");
        }

        User user = new User();
        user.setPhoneNumber(phoneNumber);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRealName(realName);
        user.setEmail(email);
        user.setIdCard(idCard);

        if (genderStr != null) {
            try {
                user.setGender(Integer.parseInt(genderStr));
            } catch (NumberFormatException ignored) {
                return Result.fail(400, "invalid gender");
            }
        }

        user.setUserStatus(1);
        user.setCreateTime(LocalDateTime.now());

        int rows = userMapper.insert(user);
        return Result.ok(rows > 0);
    }

    @Override
    public Result<User> getUserById(Long userId) {
        if (userId == null || userId <= 0) return Result.fail(400, "userId is required");
        User u = userMapper.selectById(userId);
        if (u == null) return Result.fail(404, "user not found");
        return Result.ok(u);
    }

    @Override
    public Result<User> updateProfile(Long userId, String email, String avatarUrl, Integer gender, String realName, String idCard) {
        if (userId == null || userId <= 0) return Result.fail(400, "userId is required");
        User u = userMapper.selectById(userId);
        if (u == null) return Result.fail(404, "user not found");

        if (gender != null) {
            int g = gender;
            if (g != 0 && g != 1 && g != 2) return Result.fail(400, "invalid gender");
            u.setGender(g);
        }

        if (avatarUrl != null) {
            String v = avatarUrl.trim();
            if (v.length() > 512) return Result.fail(400, "avatarUrl too long");
            if (!v.isEmpty() && !(v.startsWith("http://") || v.startsWith("https://"))) return Result.fail(400, "invalid avatarUrl");
            u.setAvatarUrl(v.isEmpty() ? null : v);
        }

        if (email != null) {
            String v = email.trim();
            if (!v.isEmpty() && !v.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) return Result.fail(400, "invalid email");
            u.setEmail(v.isEmpty() ? null : v);
        }

        if (realName != null || idCard != null) {
            if (u.getIdCard() != null && !u.getIdCard().isBlank()) return Result.fail(409, "already verified");
            String rn = realName != null ? realName.trim() : "";
            String idc = idCard != null ? idCard.trim() : "";
            if (rn.isEmpty() || idc.isEmpty()) return Result.fail(400, "realName and idCard are required");
            if (!idc.matches("^\\d{17}[\\dXx]$")) return Result.fail(400, "invalid idCard");
            u.setRealName(rn);
            u.setIdCard(idc.toUpperCase());
        }

        int rows = userMapper.updateById(u);
        if (rows <= 0) return Result.fail(500, "update failed");
        return Result.ok(u);
    }

    @Override
    public Result<User> bindEmail(Long userId, String value, String code) {
        if (userId == null || userId <= 0) return Result.fail(400, "userId is required");

        String email = value == null ? "" : value.trim();
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) return Result.fail(400, "invalid email");
        if (code == null || !"123456".equals(code.trim())) return Result.fail(400, "invalid verify code");

        User u = userMapper.selectById(userId);
        if (u == null) return Result.fail(404, "user not found");
        u.setEmail(email);
        int rows = userMapper.updateById(u);
        if (rows <= 0) return Result.fail(500, "update failed");
        return Result.ok(u);
    }

    @Override
    public Result<User> bindPhone(Long userId, String value, String code) {
        if (userId == null || userId <= 0) return Result.fail(400, "userId is required");

        String phone = value == null ? "" : value.trim();
        if (!phone.matches("^1[3-9]\\d{9}$")) return Result.fail(400, "invalid phone");
        if (code == null || !"123456".equals(code.trim())) return Result.fail(400, "invalid verify code");

        User exists = userMapper.selectOne(new QueryWrapper<User>().eq("phone_number", phone).ne("user_id", userId));
        if (exists != null) return Result.fail(409, "phone number already exists");

        User u = userMapper.selectById(userId);
        if (u == null) return Result.fail(404, "user not found");
        u.setPhoneNumber(phone);
        int rows = userMapper.updateById(u);
        if (rows <= 0) return Result.fail(500, "update failed");
        return Result.ok(u);
    }

    @Override
    public Result<Boolean> changePassword(Long userId, String oldPassword, String newPassword) {
        if (userId == null || userId <= 0) return Result.fail(400, "userId is required");
        User u = userMapper.selectById(userId);
        if (u == null) return Result.fail(404, "user not found");

        if (u.getPasswordHash() == null || oldPassword == null || !passwordEncoder.matches(oldPassword, u.getPasswordHash())) {
            return Result.fail(401, "invalid password");
        }

        String np = newPassword == null ? "" : newPassword.trim();
        if (np.length() < 6) return Result.fail(400, "password too short");

        u.setPasswordHash(passwordEncoder.encode(np));
        int rows = userMapper.updateById(u);
        return Result.ok(rows > 0);
    }
}

