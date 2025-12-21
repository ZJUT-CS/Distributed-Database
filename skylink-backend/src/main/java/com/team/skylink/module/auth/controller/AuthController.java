package com.team.skylink.module.auth.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.admin.service.AdminManagementService; // 导入 AdminService
import com.team.skylink.module.auth.dto.AdminLoginRequest;
import com.team.skylink.module.auth.dto.LoginRequest;
import com.team.skylink.module.auth.dto.LoginResponse;
import com.team.skylink.module.auth.service.AuthService;
import com.team.skylink.module.auth.service.SessionIdentity;
import com.team.skylink.module.auth.service.SessionStore;
import com.team.skylink.module.user.entity.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
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
    // 新增：注入管理员服务
    private final AdminManagementService adminManagementService;

    public AuthController(AuthService authService, 
                          SessionStore sessionStore,
                          AdminManagementService adminManagementService) {
        this.authService = authService;
        this.sessionStore = sessionStore;
        this.adminManagementService = adminManagementService;
    }

    // 普通用户登录
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    // ▼▼▼▼▼▼ 修改：管理员登录 ▼▼▼▼▼▼
    @PostMapping("/admin/login")
    public Result<String> adminLogin(@Valid @RequestBody AdminLoginRequest request) {
        // 调用 Admin 模块的服务
        return adminManagementService.login(request.getAdminAccount(), request.getPassword());
    }

    // ⚠️ 注意：移除了 /admin/register 接口，因为这属于后台管理功能，应在 AdminController 中处理

    // 普通用户注册
    @PostMapping("/register")
    public Result<Boolean> register(@RequestBody Map<String, String> body) {
        return authService.phoneRegister(body);
    }

    // ... 下面的代码保持不变 (phoneRegister, me, updateProfile 等) ...
    @PostMapping("/phone-register")
    public Result<Boolean> phoneRegister(@RequestBody Map<String, String> body) {
        return authService.phoneRegister(body);
    }
    
    // ... 请保留原文件中剩余的所有 User 相关方法 (me, updateProfile, bindEmail 等) ...
    // ... 为了篇幅简洁，这里省略了下面的 getters/setters 和 User 相关接口，请确保不要覆盖掉它们 ...
    
    @GetMapping("/user/me")
    public Result<UserProfileResponse> me(HttpServletRequest request) {
        Result<?> userGuard = ensureUser(request);
        if (userGuard != null) return (Result<UserProfileResponse>) userGuard;

        Long userId = getAuthedUserId(request);
        Result<User> r = authService.getUserById(userId);
        if (r.getCode() != 0) return Result.fail(r.getCode(), r.getMsg());
        return Result.ok(UserProfileResponse.from(r.getData()));
    }
    
    // ... (继续保留后面的代码) ...
    
    // 这里补上原文件用到的辅助方法，防止报错
    private static Long getAuthedUserId(HttpServletRequest request) {
        Object v = request.getAttribute(REQ_ATTR_USER_ID);
        if (v instanceof Long) return (Long) v;
        if (v instanceof Integer) return ((Integer) v).longValue();
        if (v instanceof String) {
            try { return Long.parseLong(((String) v).trim()); } catch (NumberFormatException ignored) { return null; }
        }
        return null;
    }
    
    private static Integer getAuthedUserType(HttpServletRequest request) {
         Object v = request.getAttribute(REQ_ATTR_USER_TYPE);
        if (v instanceof Integer) return (Integer) v;
        if (v instanceof Long) return ((Long) v).intValue();
        if (v instanceof String) {
            try { return Integer.parseInt(((String) v).trim()); } catch (NumberFormatException ignored) { return null; }
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
        try { return Long.parseLong(v.trim()); } catch (NumberFormatException e) { return null; }
    }
    
    // ... DTOs ...
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
    @Data public static class UpdateProfileRequest { private String email; private String avatarUrl; private Integer gender; private String realName; private String idCard; }
    @Data public static class SendCodeRequest { @NotBlank private String target; }
    @Data public static class BindContactRequest { @NotBlank private String value; @NotBlank private String code; }
    @Data public static class ChangePasswordRequest { @NotBlank private String oldPassword; @NotBlank private String newPassword; }
}