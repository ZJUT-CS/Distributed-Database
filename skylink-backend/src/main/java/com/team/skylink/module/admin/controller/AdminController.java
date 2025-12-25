package com.team.skylink.module.admin.controller;

import com.team.skylink.common.Result;
import com.team.skylink.common.PageResult;
import com.team.skylink.module.admin.entity.Admin;
import com.team.skylink.module.admin.service.AdminManagementService;
import com.team.skylink.module.system.entity.SystemLog;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.Data;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admins")
public class AdminController {
    private final AdminManagementService adminManagementService;

    public AdminController(AdminManagementService adminManagementService) {
        this.adminManagementService = adminManagementService;
    }

    @PostMapping("/sessions")
    public Result<com.team.skylink.module.admin.dto.AdminLoginResponse> login(@Valid @RequestBody com.team.skylink.module.admin.dto.AdminLoginRequest request) {
        return adminManagementService.login(request.getAdminAccount(), request.getPassword());
    }

    @GetMapping("")
    @Operation(summary = "获取管理员列表")
    public Result<List<Admin>> listAdmins(@RequestParam(required = false) String keyword) {
        return adminManagementService.listAdmins(keyword);
    }

    @GetMapping("/page")
    @Operation(summary = "获取管理员列表（分页）")
    public Result<PageResult<Admin>> listAdminsPage(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer size
    ) {
        return adminManagementService.listAdminsPage(keyword, page, size);
    }

    @PostMapping("")
    @Operation(summary = "创建管理员（仅超级管理员）")
    @Parameter(name = "X-User-Type", description = "管理员类型标识，固定为 2", required = true)
    @Parameter(name = "X-Admin-Role", description = "管理员角色：1=普通管理员，2=超级管理员", required = true)
    public Result<Admin> createAdmin(HttpServletRequest request, @RequestBody AdminCreateRequest body) {
        System.out.println("createAdmin body: " + body);
        Result<?> guard = ensureSuperAdmin(request);
        if (guard != null) return (Result<Admin>) guard;
        return adminManagementService.createAdmin(
            body.getAdminAccount(), 
            body.getPassword(), 
            body.getRole()
        );
    }

    @DeleteMapping("/{adminId}")
    @Operation(summary = "删除管理员（仅超级管理员）")
    public Result<Void> deleteAdmin(HttpServletRequest request, @PathVariable Long adminId) {
        Result<?> guard = ensureSuperAdmin(request);
        if (guard != null) return (Result<Void>) guard;
        return adminManagementService.deleteAdmin(adminId);
    }

    @PostMapping("/{adminId}/reset-password")
    @Operation(summary = "重置管理员密码（仅超级管理员）")
    public Result<Void> resetPassword(HttpServletRequest request, @PathVariable Long adminId, @RequestBody ResetPasswordRequest body) {
        Result<?> guard = ensureSuperAdmin(request);
        if (guard != null) return (Result<Void>) guard;
        return adminManagementService.resetAdminPassword(adminId, body.getNewPassword());
    }

    @PutMapping("/{adminId}")
    @Operation(summary = "更新管理员信息（仅超级管理员）")
    @Parameter(name = "X-User-Type", description = "管理员类型标识，固定为 2", required = true)
    @Parameter(name = "X-Admin-Role", description = "管理员角色：1=普通管理员，2=超级管理员", required = true)
    public Result<Admin> updateAdmin(HttpServletRequest request, @PathVariable Long adminId, @RequestBody AdminUpdateRequest body) {
        Result<?> guard = ensureSuperAdmin(request);
        if (guard != null) return (Result<Admin>) guard;
        return adminManagementService.updateAdmin(adminId, body.getAdminAccount(), body.getRole(), body.getPassword());
    }

    @GetMapping("/count")
    public Result<Long> adminCount() {
        return adminManagementService.adminCount();
    }

    @GetMapping("/system-configs/count")
    public Result<Long> configCount() { return adminManagementService.configCount(); }
    @GetMapping("/operation-logs/count")
    public Result<Long> operationLogCount() { return adminManagementService.operationLogCount(); }
    @GetMapping("/user-behavior-stats/count")
    public Result<Long> userBehaviorStatCount() { return adminManagementService.userBehaviorStatCount(); }
    @GetMapping("/refund-change-requests/count")
    public Result<Long> changeRequestCount() { return adminManagementService.changeRequestCount(); }

    @GetMapping("/system-logs")
    @Operation(summary = "获取系统操作日志列表")
    public Result<PageResult<SystemLog>> listSystemLogs(
            @RequestParam(required = false) Long adminId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) Integer operResult,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer size
    ) {
        return adminManagementService.listSystemLogs(adminId, keyword, module, operResult, page, size);
    }

    @Data
    public static class AdminCreateRequest {
        private String adminAccount;
        private String password;
        private Integer role;
    }

    @Data
    public static class ResetPasswordRequest {
        private String newPassword;
    }

    @Data
    public static class AdminUpdateRequest {
        private String adminAccount;
        private Integer role;
        private String password;
    }

    private static Result<?> ensureSuperAdmin(HttpServletRequest request) {
        String t = request.getHeader("X-User-Type");
        if (t == null || (!"2".equals(t.trim()))) {
            return Result.fail(403, "admin required");
        }
        String r = request.getHeader("X-Admin-Role");
        if (r == null || (!"2".equals(r.trim()))) {
            return Result.fail(403, "super admin required");
        }
        return null;
    }
}
