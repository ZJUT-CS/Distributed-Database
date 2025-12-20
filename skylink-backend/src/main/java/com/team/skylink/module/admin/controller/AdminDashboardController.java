package com.team.skylink.module.admin.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.AdminDashboardMetricsResponse;
import com.team.skylink.module.admin.service.AdminDashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {
    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    // 批处理式指标接口：一次请求返回大盘需要的多个计数，减少网络开销
    @GetMapping("/metrics")
    public Result<AdminDashboardMetricsResponse> metrics() {
        return adminDashboardService.metrics();
    }
}
