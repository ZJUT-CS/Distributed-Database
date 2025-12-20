package com.team.skylink.module.auth.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.auth.dto.AdminLoginRequest;
import com.team.skylink.module.auth.dto.LoginRequest;
import com.team.skylink.module.auth.dto.LoginResponse;
import com.team.skylink.module.auth.dto.AdminRegisterRequest;
import com.team.skylink.module.auth.service.AuthService;
import com.team.skylink.module.auth.service.SessionIdentity;
import com.team.skylink.module.auth.service.SessionStore;
import com.team.skylink.module.auth.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping({"/auth", "/api/v1/auth"})
public class AuthController {
    private static final String REQ_ATTR_USER_ID = "auth.userId";
    private static final String REQ_ATTR_USER_TYPE = "auth.userType";

    private final AuthService authService;
    private final SessionStore sessionStore;

    public AuthController(AuthService authService, SessionStore sessionStore) {
        this.authService = authService;
        this.sessionStore = sessionStore;
    }

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/admin/login")
    public Result<LoginResponse> adminLogin(@Valid @RequestBody AdminLoginRequest request) {
        return authService.adminLogin(request);
    }

    @PostMapping("/admin/register")
    public Result<Boolean> adminRegister(@Valid @RequestBody AdminRegisterRequest request) {
        return authService.adminRegister(request);
    }

    @PostMapping("/register")
    public Result<Boolean> register(@RequestBody Map<String, String> body) {
        return authService.phoneRegister(body);
    }

    @PostMapping("/phone-register")
    public Result<Boolean> phoneRegister(@RequestBody Map<String, String> body) {
        return authService.phoneRegister(body);
    }

    @GetMapping("/user/me")
    public Result<UserProfileResponse> me(HttpServletRequest request) {
        Result<?> userGuard = ensureUser(request);
        if (userGuard != null) return (Result<UserProfileResponse>) userGuard;

        Long userId = getAuthedUserId(request);
        Result<User> r = authService.getUserById(userId);
        if (r.getCode() != 0) return Result.fail(r.getCode(), r.getMsg());
        return Result.ok(UserProfileResponse.from(r.getData()));
    }

    @PutMapping("/user/profile")
    public Result<UserProfileResponse> updateProfile(HttpServletRequest request, @Valid @RequestBody UpdateProfileRequest req) {
        Result<?> userGuard = ensureUser(request);
        if (userGuard != null) return (Result<UserProfileResponse>) userGuard;

        Long userId = getAuthedUserId(request);
        Result<User> r = authService.updateProfile(userId, req.getEmail(), req.getAvatarUrl(), req.getGender(), req.getRealName(), req.getIdCard());
        if (r.getCode() != 0) return Result.fail(r.getCode(), r.getMsg());
        return Result.ok(UserProfileResponse.from(r.getData()));
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

        Long userId = getAuthedUserId(request);
        Result<User> r = authService.bindEmail(userId, req.getValue(), req.getCode());
        if (r.getCode() != 0) return Result.fail(r.getCode(), r.getMsg());
        return Result.ok(UserProfileResponse.from(r.getData()));
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

        Long userId = getAuthedUserId(request);
        Result<User> r = authService.bindPhone(userId, req.getValue(), req.getCode());
        if (r.getCode() != 0) return Result.fail(r.getCode(), r.getMsg());
        return Result.ok(UserProfileResponse.from(r.getData()));
    }

    @PutMapping("/user/password")
    public Result<Boolean> changePassword(HttpServletRequest request, @Valid @RequestBody ChangePasswordRequest req) {
        Result<?> userGuard = ensureUser(request);
        if (userGuard != null) return (Result<Boolean>) userGuard;

        Long userId = getAuthedUserId(request);
        return authService.changePassword(userId, req.getOldPassword(), req.getNewPassword());
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

    private Result<?> ensureUser(HttpServletRequest request) {
        String token = parseBearerToken(request);
        if (token != null) {
            SessionIdentity s = sessionStore.resolve(token);
            if (s != null) {
                request.setAttribute(REQ_ATTR_USER_ID, s.userId());
                request.setAttribute(REQ_ATTR_USER_TYPE, s.userType());
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

    private static String parseBearerToken(HttpServletRequest request) {
        String v = request.getHeader("Authorization");
        if (v == null || v.isBlank()) return null;
        String trimmed = v.trim();
        if (trimmed.length() < 8) return null;
        if (!trimmed.regionMatches(true, 0, "Bearer ", 0, 7)) return null;
        String token = trimmed.substring(7).trim();
        return token.isEmpty() ? null : token;
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
