package com.team.skylink.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.dto.AdminLoginRequest;
import com.team.skylink.dto.LoginRequest;
import com.team.skylink.dto.LoginResponse;
import com.team.skylink.dto.AdminRegisterRequest;
import com.team.skylink.entity.Admin;
import com.team.skylink.entity.User;
import com.team.skylink.mapper.AdminMapper;
import com.team.skylink.mapper.UserMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping({"/auth", "/api/v1/auth"})
public class AuthController {
    private static final ConcurrentHashMap<String, SessionIdentity> SESSIONS = new ConcurrentHashMap<>();
    private static final String REQ_ATTR_USER_ID = "auth.userId";
    private static final String REQ_ATTR_USER_TYPE = "auth.userType";

    private final UserMapper userMapper;
    private final AdminMapper adminMapper;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserMapper userMapper, AdminMapper adminMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.adminMapper = adminMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
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

        // 用户表不记录最后登录时间字段，直接返回登录结果

        String token = UUID.randomUUID().toString();
        SESSIONS.put(token, new SessionIdentity(user.getUserId(), 1, System.currentTimeMillis()));

        LoginResponse resp = new LoginResponse(
                user.getUserId(),
                user.getPhoneNumber(),
                "user",
                token
        );
        return Result.ok(resp);
    }

    @PostMapping("/admin/login")
    public Result<LoginResponse> adminLogin(@Valid @RequestBody AdminLoginRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();

        Admin admin = adminMapper.selectOne(new QueryWrapper<Admin>().eq("username", username));
        if (admin == null) {
            return Result.fail(401, "invalid username");
        }

        if (admin.getPasswordHash() == null || !passwordEncoder.matches(password, admin.getPasswordHash())) {
            return Result.fail(401, "invalid password");
        }

        long now = System.currentTimeMillis();
        admin.setLastLoginTime(now);
        adminMapper.updateById(admin);

        String token = UUID.randomUUID().toString();
        SESSIONS.put(token, new SessionIdentity(admin.getAdminId(), 2, System.currentTimeMillis()));

        LoginResponse resp = new LoginResponse(
                admin.getAdminId(),
                admin.getUsername(),
                "admin",
                token
        );
        return Result.ok(resp);
    }

    @PostMapping("/admin/register")
    public Result<Boolean> adminRegister(@Valid @RequestBody AdminRegisterRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();
        Integer role = request.getRole();

        Admin existing = adminMapper.selectOne(new QueryWrapper<Admin>().eq("username", username));
        if (existing != null) {
            return Result.fail(409, "username already exists");
        }

        Admin admin = new Admin();
        admin.setUsername(username);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole(role != null ? role : 1);
        long now = System.currentTimeMillis();
        admin.setCreateTime(now);
        admin.setLastLoginTime(now);

        int rows = adminMapper.insert(admin);
        return Result.ok(rows > 0);
    }

    @PostMapping("/register")
    public Result<Boolean> register(@RequestBody Map<String, String> body) {
        return phoneRegister(body);
    }

    @PostMapping("/phone-register")
    public Result<Boolean> phoneRegister(@RequestBody Map<String, String> body) {
        String phoneNumber = body.get("phoneNumber");
        String password = body.get("password");
        String realName = body.get("realName");
        String email = body.get("email");
        String idCard = body.get("idCard");
        String genderStr = body.get("gender");
        String birthDateStr = body.get("birthDate");

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
                // 也可以考虑在这里记录日志
            }
        }

        // 用户表无出生日期字段，忽略 birthDate

        user.setUserStatus(1);
        LocalDateTime now = LocalDateTime.now();
        user.setCreateTime(now);

        int rows = userMapper.insert(user);
        return Result.ok(rows > 0);
    }

    @GetMapping("/user/me")
    public Result<UserProfileResponse> me(HttpServletRequest request) {
        Result<?> userGuard = ensureUser(request);
        if (userGuard != null) return (Result<UserProfileResponse>) userGuard;

        Long userId = getAuthedUserId(request);
        User u = userMapper.selectById(userId);
        if (u == null) return Result.fail(404, "user not found");

        return Result.ok(UserProfileResponse.from(u));
    }

    @PutMapping("/user/profile")
    public Result<UserProfileResponse> updateProfile(HttpServletRequest request, @Valid @RequestBody UpdateProfileRequest req) {
        Result<?> userGuard = ensureUser(request);
        if (userGuard != null) return (Result<UserProfileResponse>) userGuard;

        Long userId = getAuthedUserId(request);
        User u = userMapper.selectById(userId);
        if (u == null) return Result.fail(404, "user not found");

        if (req.getGender() != null) {
            int g = req.getGender();
            if (g != 0 && g != 1 && g != 2) return Result.fail(400, "invalid gender");
            u.setGender(g);
        }

        if (req.getAvatarUrl() != null) {
            String v = req.getAvatarUrl().trim();
            if (v.length() > 512) return Result.fail(400, "avatarUrl too long");
            if (!v.isEmpty() && !(v.startsWith("http://") || v.startsWith("https://"))) return Result.fail(400, "invalid avatarUrl");
            u.setAvatarUrl(v.isEmpty() ? null : v);
        }

        if (req.getEmail() != null) {
            String v = req.getEmail().trim();
            if (!v.isEmpty() && !v.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) return Result.fail(400, "invalid email");
            u.setEmail(v.isEmpty() ? null : v);
        }

        if (req.getRealName() != null || req.getIdCard() != null) {
            if (u.getIdCard() != null && !u.getIdCard().isBlank()) return Result.fail(409, "already verified");
            String rn = req.getRealName() != null ? req.getRealName().trim() : "";
            String idc = req.getIdCard() != null ? req.getIdCard().trim() : "";
            if (rn.isEmpty() || idc.isEmpty()) return Result.fail(400, "realName and idCard are required");
            if (!idc.matches("^\\d{17}[\\dXx]$")) return Result.fail(400, "invalid idCard");
            u.setRealName(rn);
            u.setIdCard(idc.toUpperCase());
        }

        int rows = userMapper.updateById(u);
        if (rows <= 0) return Result.fail(500, "update failed");
        return Result.ok(UserProfileResponse.from(u));
    }

    @PostMapping("/user/email/send-code")
    public Result<Boolean> sendEmailCode(HttpServletRequest request, @Valid @RequestBody SendCodeRequest req) {
        Result<?> userGuard = ensureUser(request);
        if (userGuard != null) return (Result<Boolean>) userGuard;

        String target = req.getTarget().trim();
        if (!target.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) return Result.fail(400, "invalid email");
        return Result.ok(true);
    }

    @PutMapping("/user/email")
    public Result<UserProfileResponse> bindEmail(HttpServletRequest request, @Valid @RequestBody BindContactRequest req) {
        Result<?> userGuard = ensureUser(request);
        if (userGuard != null) return (Result<UserProfileResponse>) userGuard;

        String email = req.getValue().trim();
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) return Result.fail(400, "invalid email");
        if (!"123456".equals(req.getCode().trim())) return Result.fail(400, "invalid verify code");

        Long userId = getAuthedUserId(request);
        User u = userMapper.selectById(userId);
        if (u == null) return Result.fail(404, "user not found");
        u.setEmail(email);
        int rows = userMapper.updateById(u);
        if (rows <= 0) return Result.fail(500, "update failed");
        return Result.ok(UserProfileResponse.from(u));
    }

    @PostMapping("/user/phone/send-code")
    public Result<Boolean> sendPhoneCode(HttpServletRequest request, @Valid @RequestBody SendCodeRequest req) {
        Result<?> userGuard = ensureUser(request);
        if (userGuard != null) return (Result<Boolean>) userGuard;

        String target = req.getTarget().trim();
        if (!target.matches("^1[3-9]\\d{9}$")) return Result.fail(400, "invalid phone");
        return Result.ok(true);
    }

    @PutMapping("/user/phone")
    public Result<UserProfileResponse> bindPhone(HttpServletRequest request, @Valid @RequestBody BindContactRequest req) {
        Result<?> userGuard = ensureUser(request);
        if (userGuard != null) return (Result<UserProfileResponse>) userGuard;

        String phone = req.getValue().trim();
        if (!phone.matches("^1[3-9]\\d{9}$")) return Result.fail(400, "invalid phone");
        if (!"123456".equals(req.getCode().trim())) return Result.fail(400, "invalid verify code");

        Long userId = getAuthedUserId(request);
        User exists = userMapper.selectOne(new QueryWrapper<User>().eq("phone_number", phone).ne("user_id", userId));
        if (exists != null) return Result.fail(409, "phone number already exists");

        User u = userMapper.selectById(userId);
        if (u == null) return Result.fail(404, "user not found");
        u.setPhoneNumber(phone);
        int rows = userMapper.updateById(u);
        if (rows <= 0) return Result.fail(500, "update failed");
        return Result.ok(UserProfileResponse.from(u));
    }

    @PutMapping("/user/password")
    public Result<Boolean> changePassword(HttpServletRequest request, @Valid @RequestBody ChangePasswordRequest req) {
        Result<?> userGuard = ensureUser(request);
        if (userGuard != null) return (Result<Boolean>) userGuard;

        Long userId = getAuthedUserId(request);
        User u = userMapper.selectById(userId);
        if (u == null) return Result.fail(404, "user not found");

        if (u.getPasswordHash() == null || !passwordEncoder.matches(req.getOldPassword(), u.getPasswordHash())) {
            return Result.fail(401, "invalid password");
        }

        String np = req.getNewPassword().trim();
        if (np.length() < 6) return Result.fail(400, "password too short");

        u.setPasswordHash(passwordEncoder.encode(np));
        int rows = userMapper.updateById(u);
        return Result.ok(rows > 0);
    }

    private static final class SessionIdentity {
        private final Long userId;
        private final Integer userType;
        private final Long issuedAtMs;

        private SessionIdentity(Long userId, Integer userType, Long issuedAtMs) {
            this.userId = userId;
            this.userType = userType;
            this.issuedAtMs = issuedAtMs;
        }
    }

    private static String parseBearerToken(HttpServletRequest request) {
        String v = request.getHeader("Authorization");
        if (v == null || v.isBlank()) return null;
        String trimmed = v.trim();
        if (trimmed.length() < 8) return null;
        if (!trimmed.regionMatches(true, 0, "Bearer ", 0, 7)) return null;
        String token = trimmed.substring(7).trim();
        return token.isEmpty() ? null : token;
    }

    private static Long getAuthedUserId(HttpServletRequest request) {
        Object v = request.getAttribute(REQ_ATTR_USER_ID);
        if (v instanceof Long) return (Long) v;
        if (v instanceof Integer) return ((Integer) v).longValue();
        if (v instanceof String) {
            try {
                return Long.parseLong(((String) v).trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private static Integer getAuthedUserType(HttpServletRequest request) {
        Object v = request.getAttribute(REQ_ATTR_USER_TYPE);
        if (v instanceof Integer) return (Integer) v;
        if (v instanceof Long) return ((Long) v).intValue();
        if (v instanceof String) {
            try {
                return Integer.parseInt(((String) v).trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private static Result<?> ensureUser(HttpServletRequest request) {
        String token = parseBearerToken(request);
        if (token != null) {
            SessionIdentity s = SESSIONS.get(token);
            if (s != null) {
                request.setAttribute(REQ_ATTR_USER_ID, s.userId);
                request.setAttribute(REQ_ATTR_USER_TYPE, s.userType);
            }
        }

        if (getAuthedUserId(request) == null) {
            Long userId = parseLongHeader(request, "X-User-Id");
            if (userId != null) request.setAttribute(REQ_ATTR_USER_ID, userId);
        }
        if (getAuthedUserType(request) == null) {
            String t = request.getHeader("X-User-Type");
            if (t != null && !t.isBlank()) request.setAttribute(REQ_ATTR_USER_TYPE, t.trim());
        }

        Long userId = getAuthedUserId(request);
        if (userId == null || userId <= 0) return Result.fail(401, "login required");
        Integer userType = getAuthedUserType(request);
        if (userType == null || userType != 1) return Result.fail(403, "user required");
        return null;
    }

    private static Long parseLongHeader(HttpServletRequest request, String name) {
        String v = request.getHeader(name);
        if (v == null || v.isBlank()) return null;
        try {
            return Long.parseLong(v.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @Data
    public static class UserProfileResponse {
        private Long userId;
        private String phoneNumber;
        private String email;
        private String realName;
        private String idCard;
        private Integer gender;
        private String avatarUrl;
        private LocalDateTime createTime;

        public static UserProfileResponse from(User u) {
            UserProfileResponse r = new UserProfileResponse();
            r.setUserId(u.getUserId());
            r.setPhoneNumber(u.getPhoneNumber());
            r.setEmail(u.getEmail());
            r.setRealName(u.getRealName());
            r.setIdCard(u.getIdCard());
            r.setGender(u.getGender());
            r.setAvatarUrl(u.getAvatarUrl());
            r.setCreateTime(u.getCreateTime());
            return r;
        }
    }

    @Data
    public static class UpdateProfileRequest {
        private String email;
        private String avatarUrl;
        private Integer gender;
        private String realName;
        private String idCard;
    }

    @Data
    public static class SendCodeRequest {
        @NotBlank
        private String target;
    }

    @Data
    public static class BindContactRequest {
        @NotBlank
        private String value;
        @NotBlank
        private String code;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank
        private String oldPassword;
        @NotBlank
        private String newPassword;
    }
}
