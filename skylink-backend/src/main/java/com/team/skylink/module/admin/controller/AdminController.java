package com.team.skylink.module.admin.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.admin.entity.Admin;
import com.team.skylink.module.admin.service.AdminManagementService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.Data;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admins")
public class AdminController {
    private final AdminManagementService adminManagementService;

    public AdminController(AdminManagementService adminManagementService) {
        this.adminManagementService = adminManagementService;
    }

    @PostMapping("/sessions")
    public Result<String> login(@Valid @RequestBody com.team.skylink.module.auth.dto.AdminLoginRequest request) {
        return adminManagementService.login(request.getAdminAccount(), request.getPassword());
    }

    // ▼▼▼▼▼▼ 新增：创建管理员的接口 ▼▼▼▼▼▼
    @PostMapping("")
    public Result<Admin> createAdmin(HttpServletRequest request, @RequestBody AdminCreateRequest body) {
        System.out.println("createAdmin body: " + body);
        // 将前端传来的 role (可能是 null) 传给 Service
        return adminManagementService.createAdmin(
            body.getAdminAccount(), 
            body.getPassword(), 
            body.getRole()
        );
    }
    // ▲▲▲▲▲▲ 新增结束 ▲▲▲▲▲▲

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

    // 定义接收参数的内部类 (DTO)
    @Data
    public static class AdminCreateRequest {
        private String adminAccount;
        private String password;
        private Integer role; // 新增 role 字段，允许前端指定 (不传则是 null)
    }
}
