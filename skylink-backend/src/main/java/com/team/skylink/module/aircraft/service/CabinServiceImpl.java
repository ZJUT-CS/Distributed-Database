package com.team.skylink.module.aircraft.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.module.aircraft.dto.AvailableCabinDto;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.entity.Seat;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.flight.mapper.SeatMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 机舱配置服务实现
 */
@Slf4j
@Service
public class CabinServiceImpl implements CabinService {

    private final AircraftCabinConfigMapper configMapper;
    private final FlightMapper flightMapper;
    private final SeatMapper seatMapper;

    // 舱位类型中文名映射
    private static final Map<String, String> CABIN_TYPE_NAMES = new HashMap<>();
    static {
        CABIN_TYPE_NAMES.put("Y", "经济舱");
        CABIN_TYPE_NAMES.put("J", "商务舱");
        CABIN_TYPE_NAMES.put("F", "头等舱");
        CABIN_TYPE_NAMES.put("W", "超级经济舱");
    }

    public CabinServiceImpl(AircraftCabinConfigMapper configMapper,
            FlightMapper flightMapper,
            SeatMapper seatMapper) {
        this.configMapper = configMapper;
        this.flightMapper = flightMapper;
        this.seatMapper = seatMapper;
    }

    @Override
    public List<AvailableCabinDto> getAvailableCabins(Long flightId) {
        // 1. 查询航班信息
        Flight flight = flightMapper.selectById(flightId);
        if (flight == null) {
            log.warn("查询可用舱位失败：航班不存在 flightId={}", flightId);
            return new ArrayList<>();
        }

        // 2. 查询该机型的所有舱位配置
        List<AircraftCabinConfig> configs = configMapper.selectList(
                new QueryWrapper<AircraftCabinConfig>()
                        .eq("model_id", flight.getModelId())
                        .orderByAsc("cabin_type"));

        if (configs.isEmpty()) {
            log.warn("该机型没有配置舱位信息 modelId={}", flight.getModelId());
            return new ArrayList<>();
        }

        // 3. 统计每个舱位的可用座位数
        List<AvailableCabinDto> result = new ArrayList<>();
        for (AircraftCabinConfig config : configs) {
            // 查询该航班该舱位的可用座位数 (status=1表示可用)
            // 注意：seat表使用cabinType字符串字段，而非cabin_id
            Long availableCount = seatMapper.selectCount(
                    new QueryWrapper<Seat>()
                            .eq("flight_id", flightId)
                            .in("cabin_type", cabinTypeVariants(config.getCabinType()))
                            .eq("status", 1) // 1=可用
            );

            // 只返回有可用座位的舱位
            if (availableCount != null && availableCount > 0) {
                AvailableCabinDto dto = new AvailableCabinDto();
                dto.setConfigId(config.getConfigId());
                dto.setCabinType(config.getCabinType());
                dto.setCabinName(CABIN_TYPE_NAMES.getOrDefault(
                        config.getCabinType(),
                        config.getCabinType()));
                dto.setAvailableSeats(availableCount.intValue());
                dto.setCoefficient(config.getCabinCoefficient());
                dto.setCarryOn(config.getDefaultCarryOn());
                dto.setChecked(config.getDefaultChecked());
                dto.setServices(config.getDefaultServices());
                result.add(dto);
            }
        }

        return result;
    }

    private List<String> cabinTypeVariants(String cabinType) {
        String t = cabinType == null ? "" : cabinType.trim().toUpperCase();
        if ("ECONOMY".equals(t)) return java.util.Arrays.asList("ECONOMY", "Y");
        if ("BUSINESS".equals(t)) return java.util.Arrays.asList("BUSINESS", "J");
        if ("FIRST".equals(t)) return java.util.Arrays.asList("FIRST", "F");
        if ("Y".equals(t)) return java.util.Arrays.asList("Y", "ECONOMY");
        if ("J".equals(t)) return java.util.Arrays.asList("J", "BUSINESS");
        if ("F".equals(t)) return java.util.Arrays.asList("F", "FIRST");
        return java.util.Collections.singletonList(t);
    }
}
