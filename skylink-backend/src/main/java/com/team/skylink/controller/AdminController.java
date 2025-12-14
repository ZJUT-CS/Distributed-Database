package com.team.skylink.controller;

import com.team.skylink.common.Result;
import com.team.skylink.mapper.AdminMapper;
import com.team.skylink.mapper.ChangeRequestMapper;
import com.team.skylink.mapper.ConfigMapper;
import com.team.skylink.mapper.FlightDailyStatMapper;
import com.team.skylink.mapper.OperationLogMapper;
import com.team.skylink.mapper.UserBehaviorStatMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
public class AdminController {
    private final AdminMapper adminMapper;
    private final ConfigMapper configMapper;
    private final OperationLogMapper operationLogMapper;
    private final FlightDailyStatMapper flightDailyStatMapper;
    private final UserBehaviorStatMapper userBehaviorStatMapper;
    private final ChangeRequestMapper changeRequestMapper;

    public AdminController(AdminMapper adminMapper,
                           ConfigMapper configMapper,
                           OperationLogMapper operationLogMapper,
                           FlightDailyStatMapper flightDailyStatMapper,
                           UserBehaviorStatMapper userBehaviorStatMapper,
                           ChangeRequestMapper changeRequestMapper) {
        this.adminMapper = adminMapper;
        this.configMapper = configMapper;
        this.operationLogMapper = operationLogMapper;
        this.flightDailyStatMapper = flightDailyStatMapper;
        this.userBehaviorStatMapper = userBehaviorStatMapper;
        this.changeRequestMapper = changeRequestMapper;
    }

    @GetMapping("/admins/count")
    public Result<Long> adminCount() {
        return Result.ok(adminMapper.selectCount(null));
    }

    @GetMapping("/configs/count")
    public Result<Long> configCount() {
        return Result.ok(configMapper.selectCount(null));
    }

    @GetMapping("/logs/operation/count")
    public Result<Long> operationLogCount() {
        return Result.ok(operationLogMapper.selectCount(null));
    }

    @GetMapping("/stats/flight-daily/count")
    public Result<Long> flightDailyStatCount() {
        return Result.ok(flightDailyStatMapper.selectCount(null));
    }

    @GetMapping("/stats/user-behavior/count")
    public Result<Long> userBehaviorStatCount() {
        return Result.ok(userBehaviorStatMapper.selectCount(null));
    }

    @GetMapping("/change-requests/count")
    public Result<Long> changeRequestCount() {
        return Result.ok(changeRequestMapper.selectCount(null));
    }
}
