package com.team.skylink.module.admin.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.admin.entity.Admin;
import com.team.skylink.module.admin.service.AdminManagementService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/admin", "/api/v1/admin"})
public class AdminController {
    private final AdminManagementService adminManagementService;

    public AdminController(AdminManagementService adminManagementService) {
        this.adminManagementService = adminManagementService;
    }

    // ▼▼▼▼▼▼ 新增：创建管理员的接口 ▼▼▼▼▼▼
    @PostMapping("/admins")
    public Result<Admin> createAdmin(HttpServletRequest request, @RequestBody AdminCreateRequest body) {
        // 将前端传来的 role (可能是 null) 传给 Service
        return adminManagementService.createAdmin(
            body.getAdminAccount(), 
            body.getPassword(), 
            body.getRole()
        );
    }
    // ▲▲▲▲▲▲ 新增结束 ▲▲▲▲▲▲

    @GetMapping("/admins/count")
    public Result<Long> adminCount() {
        return adminManagementService.adminCount();
    }

    @GetMapping("/configs/count")
    public Result<Long> configCount() { return adminManagementService.configCount(); }
    @GetMapping("/logs/operation/count")
    public Result<Long> operationLogCount() { return adminManagementService.operationLogCount(); }
    @GetMapping("/stats/user-behavior/count")
    public Result<Long> userBehaviorStatCount() { return adminManagementService.userBehaviorStatCount(); }
    @GetMapping("/change-requests/count")
    public Result<Long> changeRequestCount() { return adminManagementService.changeRequestCount(); }

    // 定义接收参数的内部类 (DTO)
    @Data
    public static class AdminCreateRequest {
        private String adminAccount;
        private String password;
        private Integer role; // 新增 role 字段，允许前端指定 (不传则是 null)
    }
}