package com.team.skylink.module.flight.controller;

import com.team.skylink.common.Result; // 确保导入你项目里的 Result 类
import com.team.skylink.module.flight.entity.Lal;
import com.team.skylink.module.flight.service.LalService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import java.util.List;

@RestController
@RequestMapping("/api/v1/airports") // 前端调用的路径
@RequiredArgsConstructor // 自动注入 final 字段
public class LalController {

    private final LalService lalService;

    /**
     * 获取所有机场的经纬度信息
     * 前端用途：在地图上渲染 Marker 点
     */
    @GetMapping("/locations")
    public Result<List<Lal>> getAirportLocations() {
        List<Lal> list = lalService.getAllAirports();
        return Result.ok(list);
    }
}