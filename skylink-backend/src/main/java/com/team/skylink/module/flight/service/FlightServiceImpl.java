package com.team.skylink.module.flight.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.team.skylink.common.Result;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import com.team.skylink.module.aircraft.entity.AircraftModel;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper;
import com.team.skylink.module.aircraft.mapper.AircraftModelMapper;
import com.team.skylink.module.flight.dto.FlightCreateRequest;
import com.team.skylink.module.flight.dto.FlightSearchResponse;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.flight.entity.Seat;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.flight.mapper.RouteMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.util.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class FlightServiceImpl implements FlightService {
    private final FlightMapper flightMapper;
    // 【删除】private final CabinMapper cabinMapper;
    private final AircraftModelMapper aircraftModelMapper;
    private final RouteMapper routeMapper;
    private final AircraftCabinConfigMapper cabinConfigMapper;
    private final SeatService seatService;

    public FlightServiceImpl(FlightMapper flightMapper,
                             // CabinMapper cabinMapper,
                             AircraftModelMapper aircraftModelMapper,
                             RouteMapper routeMapper,
                             AircraftCabinConfigMapper cabinConfigMapper,
                             SeatService seatService) {
        this.flightMapper = flightMapper;
        // this.cabinMapper = cabinMapper;
        this.aircraftModelMapper = aircraftModelMapper;
        this.routeMapper = routeMapper;
        this.cabinConfigMapper = cabinConfigMapper;
        this.seatService = seatService;
    }

    @Override
    public Result<List<FlightSearchResponse>> search(String departurePlace, String destination, String flightNo, String airlineCompany, String cabinType, Integer status, LocalDate departureDate, LocalDateTime departureTimeFrom, LocalDateTime departureTimeTo) {
        LambdaQueryWrapper<Flight> qw = Wrappers.lambdaQuery();

        if (StringUtils.hasText(departurePlace)) qw.eq(Flight::getDepartureCity, departurePlace);
        if (StringUtils.hasText(destination)) qw.eq(Flight::getArrivalCity, destination);
        if (StringUtils.hasText(flightNo)) qw.eq(Flight::getFlightNo, flightNo);
        if (StringUtils.hasText(airlineCompany)) qw.like(Flight::getAirlineCompany, airlineCompany);
        if (status != null) qw.eq(Flight::getStatus, status);
        else qw.eq(Flight::getStatus, 1); // Default to search only planned flights

        if (departureDate != null) {
            qw.ge(Flight::getDepartureTime, departureDate.atStartOfDay());
            qw.lt(Flight::getDepartureTime, departureDate.plusDays(1).atStartOfDay());
        }
        if (departureTimeFrom != null) qw.ge(Flight::getDepartureTime, departureTimeFrom);
        if (departureTimeTo != null) qw.le(Flight::getDepartureTime, departureTimeTo);

        List<Flight> flights = flightMapper.selectList(qw);
        List<FlightSearchResponse> responses = new ArrayList<>();

        for (Flight f : flights) {
            FlightSearchResponse res = new FlightSearchResponse();
            res.setFlightNo(f.getFlightNo());
            res.setDeparturePlace(f.getDepartureCity());
            res.setDestination(f.getArrivalCity());
            res.setDepartureTime(f.getDepartureTime());
            res.setArrivalTime(f.getArrivalTime());
            
            // Duration
            if (f.getDepartureTime() != null && f.getArrivalTime() != null) {
                java.time.Duration d = java.time.Duration.between(f.getDepartureTime(), f.getArrivalTime());
                long hours = d.toHours();
                long minutes = d.toMinutesPart();
                res.setDuration(hours + "h" + minutes + "m");
            }

            res.setPrice(f.getLowestPrice());
            res.setRemainingSeats(f.getTotalSeats()); // Simplified: using total seats
            res.setAirlineCompany(f.getAirlineCompany());
            // res.setCabinType(cabinType); // Cannot determine specific cabin type from flight level
            
            responses.add(res);
        }

        return Result.ok(responses);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> createFlight(FlightCreateRequest req) {
        // 1. 基础校验
        Flight exists = flightMapper.selectOne(Wrappers.<Flight>lambdaQuery()
                .eq(Flight::getFlightNo, req.getFlightNo())
                .eq(Flight::getDepartureTime, req.getDepartureTime()));
        if (exists != null) {
            return Result.fail(409, "flight already exists");
        }

        AircraftModel model = aircraftModelMapper.selectById(req.getModelId());
        if (model == null) return Result.fail(404, "aircraft model not found");

        Route route = routeMapper.selectById(req.getRouteId());
        if (route == null) return Result.fail(404, "route not found");

        // 2. 组装 Flight 对象
        Flight f = new Flight();
        f.setFlightNo(req.getFlightNo());
        f.setModelId(req.getModelId());
        f.setRouteId(req.getRouteId());
        
        f.setDepartureCity(route.getDepartureCity());
        f.setDepartureAirport(route.getDepartureAirport());
        f.setArrivalCity(route.getArrivalCity());
        f.setArrivalAirport(route.getArrivalAirport());
        
        f.setDepartureTime(req.getDepartureTime());
        
        if (req.getArrivalTime() != null) {
            f.setArrivalTime(req.getArrivalTime());
        } else {
            int durationMinutes = route.getEstimatedDuration() != null ? route.getEstimatedDuration() : 120;
            f.setArrivalTime(req.getDepartureTime().plusMinutes(durationMinutes));
        }

        f.setAirlineCompany(req.getAirlineCompany());

        Integer total = req.getTotalSeats();
        if (total == null) {
            total = model.getTotalPhysicalSeats();
        }
        f.setTotalSeats(total);
        f.setStatus(req.getStatus() != null ? req.getStatus() : 1);
        f.setCreateTime(LocalDateTime.now());
        f.setUpdateTime(LocalDateTime.now());
        f.setStopoverInfo(req.getStopoverInfo());

        // 3. 计算最低票价 (改用 AircraftCabinConfig)
        Integer layoutNo = req.getLayoutNo() != null ? req.getLayoutNo() : 1;
        List<AircraftCabinConfig> configs = cabinConfigMapper.selectList(Wrappers.<AircraftCabinConfig>lambdaQuery()
                .eq(AircraftCabinConfig::getModelId, model.getModelId())
                .eq(AircraftCabinConfig::getCabinLayoutNo, layoutNo));

        BigDecimal minCoeff = null; // 注意 config 里的系数通常是 Double
        for (AircraftCabinConfig cfg : configs) {
            if (cfg.getCabinCoefficient() != null) {
                if (minCoeff == null || cfg.getCabinCoefficient().compareTo(minCoeff) < 0) {
                    minCoeff = cfg.getCabinCoefficient();
                }
            }
        }
        
        BigDecimal lowestPrice = route.getBasePrice();
        if (minCoeff != null) {
            lowestPrice = route.getBasePrice().multiply(minCoeff);
        }
        f.setLowestPrice(lowestPrice);

        // 4. 落库
        int rows = flightMapper.insert(f);
        if (rows <= 0) return Result.fail(500, "insert flight failed");

        // 5. 生成物理座位
        seatService.remove(Wrappers.<Seat>lambdaQuery().eq(Seat::getFlightId, f.getFlightId())); 

        List<Seat> allSeats = new ArrayList<>();
        // 复用生成逻辑
        generateSeats(f, configs, allSeats);

        if (!allSeats.isEmpty()) {
            seatService.saveBatch(allSeats, 100);
        }

        return Result.ok(true);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> updateFlight(Long flightId, FlightCreateRequest req) {
        Flight f = flightMapper.selectById(flightId);
        if (f == null) return Result.fail(404, "flight not found");

        // 1. 检查是否修改了关键字段 (机型)
        boolean modelChanged = !f.getModelId().equals(req.getModelId());

        // 2. 更新基础信息
        f.setFlightNo(req.getFlightNo());
        f.setModelId(req.getModelId());
        f.setRouteId(req.getRouteId());
        f.setAirlineCompany(req.getAirlineCompany());
        f.setDepartureTime(req.getDepartureTime()); 
        f.setStatus(req.getStatus() != null ? req.getStatus() : 1);
        f.setUpdateTime(LocalDateTime.now());
        f.setStopoverInfo(req.getStopoverInfo());

        // 3. 同步航线信息
        Route route = routeMapper.selectById(req.getRouteId());
        if (route != null) {
            f.setDepartureCity(route.getDepartureCity());
            f.setArrivalCity(route.getArrivalCity());
            f.setDepartureAirport(route.getDepartureAirport());
            f.setArrivalAirport(route.getArrivalAirport());
            
            // 简单更新最低价 (生产环境可能需要更复杂的计算)
            f.setLowestPrice(route.getBasePrice());
        }
        
        // 4. 自动计算到达时间
        if (req.getArrivalTime() != null) {
            f.setArrivalTime(req.getArrivalTime());
        } else if (route != null) {
            int duration = route.getEstimatedDuration() != null ? route.getEstimatedDuration() : 120;
            f.setArrivalTime(req.getDepartureTime().plusMinutes(duration));
        }

        // 5. 更新航班表
        flightMapper.updateById(f);

        // 6. 【核心逻辑】如果换了机型，必须重置座位！
        if (modelChanged) {
            // A. 先删掉所有旧座位
            seatService.remove(Wrappers.<Seat>lambdaQuery().eq(Seat::getFlightId, flightId));
            
            // B. 重新获取新机型的配置
            AircraftModel model = aircraftModelMapper.selectById(req.getModelId());
            if (model != null) {
                // 更新总座位数
                f.setTotalSeats(req.getTotalSeats() != null ? req.getTotalSeats() : model.getTotalPhysicalSeats());
                flightMapper.updateById(f); // 再次更新航班的总座位数

                // C. 获取新机型的舱位配置
                Integer layoutNo = req.getLayoutNo() != null ? req.getLayoutNo() : 1;
                List<AircraftCabinConfig> configs = cabinConfigMapper.selectList(Wrappers.<AircraftCabinConfig>lambdaQuery()
                        .eq(AircraftCabinConfig::getModelId, model.getModelId())
                        .eq(AircraftCabinConfig::getCabinLayoutNo, layoutNo));

                // D. 重新生成座位
                List<Seat> allSeats = new ArrayList<>();
                generateSeats(f, configs, allSeats); // 调用提取出来的公共方法

                if (!allSeats.isEmpty()) {
                    seatService.saveBatch(allSeats, 100);
                }
            }
        }

        return Result.ok(true);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> deleteFlight(Long flightId) {
        // 1. 先把这个航班下的所有座位删掉 (物理删除)
        seatService.remove(Wrappers.<Seat>lambdaQuery().eq(Seat::getFlightId, flightId));
        
        // 2. 再删航班本身
        int rows = flightMapper.deleteById(flightId);
        
        if (rows > 0) {
            return Result.ok(true);
        } else {
            return Result.fail(404, "flight not found");
        }
    }


    /**
     * 提取公共座位生成逻辑，供 createFlight 和 updateFlight 复用
     */
    private void generateSeats(Flight f, List<AircraftCabinConfig> configs, List<Seat> allSeats) {
        for (AircraftCabinConfig cfg : configs) {
            int capacity = cfg.getCapacity() == null ? 0 : cfg.getCapacity();
            
            String colLayout = cfg.getSeatColLayout(); 
            if (colLayout == null || colLayout.isEmpty()) colLayout = "ABCDEF"; 
            
            int startRow = cfg.getStartRowNum() != null ? cfg.getStartRowNum() : 1; 
            
            int seatsPerRow = colLayout.length();
            int totalRows = (int) Math.ceil((double) capacity / seatsPerRow);
            
            int generatedCount = 0;
            
            for (int r = 0; r < totalRows; r++) {
                int currentRow = startRow + r;
                for (int c = 0; c < seatsPerRow; c++) {
                    if (generatedCount >= capacity) break; 
                    
                    Seat s = new Seat();
                    s.setFlightId(f.getFlightId());
                    s.setCabinType(cfg.getCabinType());
                    
                    char colChar = colLayout.charAt(c);
                    s.setSeatNumber(currentRow + String.valueOf(colChar));
                    
                    s.setStatus(1);
                    s.setUpdateTime(LocalDateTime.now());
                    
                    allSeats.add(s);
                    generatedCount++;
                }
            }
        }
    }
}