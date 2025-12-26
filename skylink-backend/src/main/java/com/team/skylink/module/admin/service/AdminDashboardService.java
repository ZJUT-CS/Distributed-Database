package com.team.skylink.module.admin.service;

import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.AdminDashboardMetricsResponse;

public interface AdminDashboardService {
    Result<AdminDashboardMetricsResponse> metrics();
}

