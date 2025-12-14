package com.team.skylink.controller;

import com.team.skylink.application.service.AdminService;
import com.team.skylink.application.service.ChangeRequestService;
import com.team.skylink.application.service.ConfigService;
import com.team.skylink.application.service.FlightDailyStatService;
import com.team.skylink.application.service.OperationLogService;
import com.team.skylink.application.service.UserBehaviorStatService;
import com.team.skylink.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
public class AdminController {
    private final AdminService adminService;
    private final ConfigService configService;
    private final OperationLogService operationLogService;
    private final FlightDailyStatService flightDailyStatService;
    private final UserBehaviorStatService userBehaviorStatService;
    private final ChangeRequestService changeRequestService;

    public AdminController(AdminService adminService,
                           ConfigService configService,
                           OperationLogService operationLogService,
                           FlightDailyStatService flightDailyStatService,
                           UserBehaviorStatService userBehaviorStatService,
                           ChangeRequestService changeRequestService) {
        this.adminService = adminService;
        this.configService = configService;
        this.operationLogService = operationLogService;
        this.flightDailyStatService = flightDailyStatService;
        this.userBehaviorStatService = userBehaviorStatService;
        this.changeRequestService = changeRequestService;
    }

    @GetMapping("/admins/count")
    public Result<Long> adminCount() {
        return Result.ok(adminService.count());
    }

    @GetMapping("/configs/count")
    public Result<Long> configCount() {
        return Result.ok(configService.count());
    }

    @GetMapping("/logs/operation/count")
    public Result<Long> operationLogCount() {
        return Result.ok(operationLogService.count());
    }

    @GetMapping("/stats/flight-daily/count")
    public Result<Long> flightDailyStatCount() {
        return Result.ok(flightDailyStatService.count());
    }

    @GetMapping("/stats/user-behavior/count")
    public Result<Long> userBehaviorStatCount() {
        return Result.ok(userBehaviorStatService.count());
    }

    @GetMapping("/change-requests/count")
    public Result<Long> changeRequestCount() {
        return Result.ok(changeRequestService.count());
    }
}

