package com.team.skylink.module.aircraft.service;

import com.team.skylink.module.aircraft.dto.AvailableCabinDto;
import java.util.List;

/**
 * 机舱配置服务接口
 */
public interface CabinService {
    /**
     * 查询指定航班的所有可用舱位配置（通过航班ID）
     * 
     * @param flightId 航班ID
     * @return 可用舱位列表
     */
    List<AvailableCabinDto> getAvailableCabins(Long flightId);

    /**
     * 查询指定航班的所有可用舱位配置（通过航班号）
     * 
     * @param flightNo 航班号（如CA4479）
     * @return 可用舱位列表
     */
    List<AvailableCabinDto> getAvailableCabinsByFlightNo(String flightNo);
}
