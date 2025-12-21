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
import com.team.skylink.module.flight.mapper.CabinMapper;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.flight.mapper.RouteMapper;
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
    private final CabinMapper cabinMapper;
    private final AircraftModelMapper aircraftModelMapper;
    private final RouteMapper routeMapper;
    private final AircraftCabinConfigMapper cabinConfigMapper;
    private final SeatService seatService;

    public FlightServiceImpl(FlightMapper flightMapper,
                             CabinMapper cabinMapper,
                             AircraftModelMapper aircraftModelMapper,
                             RouteMapper routeMapper,
                             AircraftCabinConfigMapper cabinConfigMapper,
                             SeatService seatService) {
        this.flightMapper = flightMapper;
        this.cabinMapper = cabinMapper;
        this.aircraftModelMapper = aircraftModelMapper;
        this.routeMapper = routeMapper;
        this.cabinConfigMapper = cabinConfigMapper;
        this.seatService = seatService;
    }

    // search 方法保持不变...
    @Override
    public Result<List<FlightSearchResponse>> search(String departurePlace, String destination, String flightNo, String airlineCompany, String cabinType, Integer status, LocalDate departureDate, LocalDateTime departureTimeFrom, LocalDateTime departureTimeTo) {
        return Result.ok(new ArrayList<>()); 
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

        // 3. 计算最低票价
        Integer layoutNo = req.getLayoutNo() != null ? req.getLayoutNo() : 1;
        List<AircraftCabinConfig> configs = cabinConfigMapper.selectList(Wrappers.<AircraftCabinConfig>lambdaQuery()
                .eq(AircraftCabinConfig::getModelId, model.getModelId())
                .eq(AircraftCabinConfig::getCabinLayoutNo, layoutNo));

        BigDecimal minCoeff = null;
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

        if (!allSeats.isEmpty()) {
            seatService.saveBatch(allSeats, 100);
        }

        return Result.ok(true);
    }

    @Override
    public Result<Boolean> updateFlight(Long flightId, FlightCreateRequest req) {
        Flight f = flightMapper.selectById(flightId);
        if (f == null) return Result.fail(404, "flight not found");

        Route route = routeMapper.selectById(req.getRouteId());
        if (route != null) {
            f.setDepartureCity(route.getDepartureCity());
            f.setArrivalCity(route.getArrivalCity());
            f.setDepartureAirport(route.getDepartureAirport());
            f.setArrivalAirport(route.getArrivalAirport());
        }
        
        if (req.getArrivalTime() != null) {
            f.setArrivalTime(req.getArrivalTime());
        } else if (route != null) {
            int duration = route.getEstimatedDuration() != null ? route.getEstimatedDuration() : 120;
            f.setArrivalTime(req.getDepartureTime().plusMinutes(duration));
        }

        flightMapper.updateById(f);
        return Result.ok(true);
    }

    // 【新增】级联删除方法
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> deleteFlight(Long flightId) {
        // 1. 先把这个航班下的所有座位删掉 (物理删除)
        // 使用 delete from seat where flight_id = ?
        seatService.remove(Wrappers.<Seat>lambdaQuery().eq(Seat::getFlightId, flightId));
        
        // 2. 再删航班本身
        int rows = flightMapper.deleteById(flightId);
        
        if (rows > 0) {
            return Result.ok(true);
        } else {
            return Result.fail(404, "flight not found");
        }
    }

}