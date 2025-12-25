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
     * GET /api/v1/cabins/available?flightNo=CA4479
     * 
     * @param flightNo 航班号（如CA4479）
     * @return 可用舱位列表
     */
    @GetMapping("/available")
    public Result<List<AvailableCabinDto>> getAvailableCabins(@RequestParam String flightNo) {
        log.info("查询可用舱位 flightNo={}", flightNo);

        if (flightNo == null || flightNo.trim().isEmpty()) {
            return Result.fail(400, "缺少航班号参数");
        }

        List<AvailableCabinDto> cabins = cabinService.getAvailableCabinsByFlightNo(flightNo.trim());
        return Result.ok(cabins);
    }
}
