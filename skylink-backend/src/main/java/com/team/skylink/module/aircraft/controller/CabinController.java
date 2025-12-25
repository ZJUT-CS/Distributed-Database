package com.team.skylink.module.aircraft.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.aircraft.dto.AvailableCabinDto;
import com.team.skylink.module.aircraft.service.CabinService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 机舱配置控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/cabins")
public class CabinController {

    private final CabinService cabinService;

    public CabinController(CabinService cabinService) {
        this.cabinService = cabinService;
    }

    /**
     * 查询指定航班的可用舱位配置
     * GET /api/v1/cabins/available?flightId=360441346
     * 
     * @param flightId 航班ID（数据库主键）
     * @return 可用舱位列表
     */
    @GetMapping("/available")
    public Result<List<AvailableCabinDto>> getAvailableCabins(@RequestParam Long flightId) {
        log.info("查询可用舱位 flightId={}", flightId);

        if (flightId == null) {
            return Result.fail(400, "缺少航班ID参数");
        }

        List<AvailableCabinDto> cabins = cabinService.getAvailableCabins(flightId);
        return Result.ok(cabins);
    }
}
