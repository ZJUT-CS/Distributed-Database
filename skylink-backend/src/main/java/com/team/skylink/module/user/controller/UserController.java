package com.team.skylink.module.user.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.user.service.AuthService;
import com.team.skylink.module.user.service.SessionIdentity;
import com.team.skylink.module.user.service.SessionStore;
import com.team.skylink.module.user.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private static final String REQ_ATTR_USER_ID = "auth.userId";
    private static final String REQ_ATTR_USER_TYPE = "auth.userType";

    private final AuthService authService;
    private final SessionStore sessionStore;

    public UserController(AuthService authService, SessionStore sessionStore) {
        this.authService = authService;
        this.sessionStore = sessionStore;
    }

    @PostMapping("")
    public Result<Boolean> register(@RequestBody Map<String, String> body) {
        return authService.phoneRegister(body);
    }

    @GetMapping("/me")
    public Result<UserProfileResponse> me(HttpServletRequest request) {
        Result<?> guard = ensureUser(request);
        if (guard != null) return (Result<UserProfileResponse>) guard;

        Long userId = getAuthedUserId(request);
        Result<User> r = authService.getUserById(userId);
        if (r.getCode() != 0) return Result.fail(r.getCode(), r.getMsg());
        return Result.ok(UserProfileResponse.from(r.getData()));
    }

    @PutMapping("/me")
    public Result<User> updateProfile(HttpServletRequest request, @RequestBody UpdateProfileRequest body) {
        Result<?> guard = ensureUser(request);
        if (guard != null) return (Result<User>) guard;

        Long userId = getAuthedUserId(request);
        return authService.updateProfile(userId, body.getEmail(), body.getAvatarUrl(), body.getGender(), body.getRealName(), body.getIdCard());
    }

    @PutMapping("/me/password")
    public Result<Boolean> changePassword(HttpServletRequest request, @Valid @RequestBody ChangePasswordRequest body) {
        Result<?> guard = ensureUser(request);
        if (guard != null) return (Result<Boolean>) guard;

        Long userId = getAuthedUserId(request);
        return authService.changePassword(userId, body.getOldPassword(), body.getNewPassword());
    }

    @PostMapping("/me/contacts")
    public Result<User> bindContact(HttpServletRequest request, @Valid @RequestBody BindContactRequest body) {
        Result<?> guard = ensureUser(request);
        if (guard != null) return (Result<User>) guard;

        Long userId = getAuthedUserId(request);
        if (body.getValue().contains("@")) {
            return authService.bindEmail(userId, body.getValue(), body.getCode());
        } else {
            return authService.bindPhone(userId, body.getValue(), body.getCode());
        }
    }

    // --- Helpers ---
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
        Long userId = getAuthedUserId(request);
        if (userId == null || userId <= 0) return Result.fail(401, "login required");
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
        try { return Long.parseLong(v.trim()); } catch (NumberFormatException e) { return null; }
    }

    private static Long getAuthedUserId(HttpServletRequest request) {
        Object v = request.getAttribute(REQ_ATTR_USER_ID);
        if (v instanceof Long) return (Long) v;
        if (v instanceof Integer) return ((Integer) v).longValue();
        if (v instanceof String) {
            try { return Long.parseLong(((String) v).trim()); } catch (NumberFormatException ignored) { return null; }
        }
        return null;
    }

    // --- DTOs ---
    @Data
    public static class UserProfileResponse {
        private Long userId; private String phoneNumber; private String email; private String realName;
        private String idCard; private Integer gender; private String avatarUrl; LocalDateTime createTime;
        public static UserProfileResponse from(User u) {
            UserProfileResponse r = new UserProfileResponse();
            r.setUserId(u.getUserId()); r.setPhoneNumber(u.getPhoneNumber()); r.setEmail(u.getEmail());
            r.setRealName(u.getRealName()); r.setIdCard(u.getIdCard()); r.setGender(u.getGender());
            r.setAvatarUrl(u.getAvatarUrl()); r.setCreateTime(u.getCreateTime());
            return r;
        }
    }

    @Data
    public static class UpdateProfileRequest {
        private String email; private String avatarUrl; private Integer gender; private String realName; private String idCard;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank private String oldPassword;
        @NotBlank private String newPassword;
    }

    @Data
    public static class BindContactRequest {
        @NotBlank private String value;
        @NotBlank private String code;
    }
}
