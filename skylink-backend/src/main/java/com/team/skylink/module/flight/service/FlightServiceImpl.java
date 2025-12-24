package com.team.skylink.module.flight.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
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
import com.team.skylink.module.flight.mapper.SeatMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.team.skylink.common.PageResult;

import com.team.skylink.module.flight.dto.FlightSearchResult;
import com.team.skylink.module.flight.dto.InterlineFlightResponse;

@Service
public class FlightServiceImpl implements FlightService {
    private final FlightMapper flightMapper;
    private final AircraftModelMapper aircraftModelMapper;
    private final RouteMapper routeMapper;
    private final AircraftCabinConfigMapper cabinConfigMapper;
    private final SeatService seatService;
    private final SeatMapper seatMapper;
    private final OrderMapper orderMapper;

    public FlightServiceImpl(FlightMapper flightMapper,
            AircraftModelMapper aircraftModelMapper,
            RouteMapper routeMapper,
            AircraftCabinConfigMapper cabinConfigMapper,
            SeatService seatService,
            SeatMapper seatMapper,
            OrderMapper orderMapper) {
        this.flightMapper = flightMapper;
        this.aircraftModelMapper = aircraftModelMapper;
        this.routeMapper = routeMapper;
        this.cabinConfigMapper = cabinConfigMapper;
        this.seatService = seatService;
        this.seatMapper = seatMapper;
        this.orderMapper = orderMapper;
    }

    @Override
    @Cacheable(value = "flightSearch", key = "#departurePlace + #destination + #departureDate + #page + #size", unless = "#result.data.directFlights.total == 0")
    public Result<FlightSearchResult> search(String departurePlace, String destination, String flightNo,
            String airlineCompany, String cabinType, Integer status, LocalDate departureDate,
            LocalDateTime departureTimeFrom, LocalDateTime departureTimeTo, int page, int size) {
        // 1. Direct Search
        LambdaQueryWrapper<Flight> qw = Wrappers.lambdaQuery();

        if (StringUtils.hasText(departurePlace))
            qw.eq(Flight::getDepartureCity, departurePlace);
        if (StringUtils.hasText(destination))
            qw.eq(Flight::getArrivalCity, destination);
        if (StringUtils.hasText(flightNo))
            qw.eq(Flight::getFlightNo, flightNo);
        if (StringUtils.hasText(airlineCompany))
            qw.like(Flight::getAirlineCompany, airlineCompany);
        if (status != null)
            qw.eq(Flight::getStatus, status);
        else
            qw.eq(Flight::getStatus, 1);

        if (departureDate != null) {
            qw.ge(Flight::getDepartureTime, departureDate.atStartOfDay());
            qw.lt(Flight::getDepartureTime, departureDate.plusDays(1).atStartOfDay());
        }
        if (departureTimeFrom != null)
            qw.ge(Flight::getDepartureTime, departureTimeFrom);
        if (departureTimeTo != null)
            qw.le(Flight::getDepartureTime, departureTimeTo);

        Page<Flight> pageParam = new Page<>(page, size);
        IPage<Flight> flightPage = flightMapper.selectPage(pageParam, qw);
        List<FlightSearchResponse> directFlights = new ArrayList<>();

        for (Flight f : flightPage.getRecords()) {
            FlightSearchResponse res = convertToResponse(f, cabinType);
            if (res != null) {
                directFlights.add(res);
            }
        }

        // 2. Interline Search (Only if Origin/Dest/Date are specified)
        List<InterlineFlightResponse> interlineFlights = new ArrayList<>();
        if (StringUtils.hasText(departurePlace) && StringUtils.hasText(destination) && departureDate != null) {
            // Find Leg 1 candidates: Origin -> Any, Date = departureDate
            List<Flight> leg1Candidates = flightMapper.selectList(Wrappers.<Flight>lambdaQuery()
                    .eq(Flight::getDepartureCity, departurePlace)
                    .eq(Flight::getStatus, 1)
                    .ge(Flight::getDepartureTime, departureDate.atStartOfDay())
                    .lt(Flight::getDepartureTime, departureDate.plusDays(1).atStartOfDay()));

            // Find Leg 2 candidates: Any -> Dest, Date = departureDate or +1
            List<Flight> leg2Candidates = flightMapper.selectList(Wrappers.<Flight>lambdaQuery()
                    .eq(Flight::getArrivalCity, destination)
                    .eq(Flight::getStatus, 1)
                    .ge(Flight::getDepartureTime, departureDate.atStartOfDay().plusHours(2))
                    .lt(Flight::getDepartureTime, departureDate.plusDays(2).atStartOfDay()));

            // Optimization: Pre-fetch Routes, Configs, Seats
            Set<Long> allFlightIds = new HashSet<>();
            Set<Long> allRouteIds = new HashSet<>();
            Set<Long> allModelIds = new HashSet<>();

            leg1Candidates.forEach(f -> {
                allFlightIds.add(f.getFlightId());
                allRouteIds.add(f.getRouteId());
                allModelIds.add(f.getModelId());
            });
            leg2Candidates.forEach(f -> {
                allFlightIds.add(f.getFlightId());
                allRouteIds.add(f.getRouteId());
                allModelIds.add(f.getModelId());
            });

            if (!allFlightIds.isEmpty()) {
                // Bulk fetch Routes
                Map<Long, Route> routeMap = new HashMap<>();
                if (!allRouteIds.isEmpty()) {
                    List<Route> routes = routeMapper.selectBatchIds(allRouteIds);
                    routeMap = routes.stream().collect(Collectors.toMap(Route::getRouteId, Function.identity()));
                }

                // ✅ Bulk fetch Aircraft Models for aircraftModel field
                Map<Long, AircraftModel> modelMap = new HashMap<>();
                if (!allModelIds.isEmpty()) {
                    List<AircraftModel> models = aircraftModelMapper.selectBatchIds(allModelIds);
                    modelMap = models.stream()
                            .collect(Collectors.toMap(AircraftModel::getModelId, Function.identity()));
                }

                // Bulk fetch Configs (by ModelId - a bit tricky as selectBatchIds not
                // applicable for non-PK, but can use IN)
                Map<Long, List<AircraftCabinConfig>> configMap = new HashMap<>();
                if (!allModelIds.isEmpty()) {
                    List<AircraftCabinConfig> allConfigs = cabinConfigMapper
                            .selectList(Wrappers.<AircraftCabinConfig>lambdaQuery()
                                    .in(AircraftCabinConfig::getModelId, allModelIds));
                    configMap = allConfigs.stream().collect(Collectors.groupingBy(AircraftCabinConfig::getModelId));
                }

                // Bulk fetch Seats
                Map<Long, Map<String, Integer>> seatMap = seatService
                        .getAvailableCountBatch(new ArrayList<>(allFlightIds));

                for (Flight leg1 : leg1Candidates) {
                    if (leg1.getArrivalCity().equals(destination))
                        continue; // Skip direct

                    for (Flight leg2 : leg2Candidates) {
                        if (leg1.getArrivalCity().equals(leg2.getDepartureCity())) {
                            Duration transferTime = Duration.between(leg1.getArrivalTime(), leg2.getDepartureTime());
                            if (transferTime.toMinutes() >= 120 && transferTime.toHours() <= 24) {
                                FlightSearchResponse r1 = convertToResponseOptimized(leg1, cabinType, routeMap,
                                        configMap, seatMap, modelMap);
                                FlightSearchResponse r2 = convertToResponseOptimized(leg2, cabinType, routeMap,
                                        configMap, seatMap, modelMap);

                                if (r1 != null && r2 != null) {
                                    InterlineFlightResponse i = new InterlineFlightResponse();
                                    i.setSegments(Arrays.asList(r1, r2));
                                    i.setTotalPrice(r1.getPrice().add(r2.getPrice()));
                                    i.setTransferCity(leg1.getArrivalCity());

                                    // 设置中转时长
                                    long hours = transferTime.toHours();
                                    long minutes = transferTime.toMinutesPart();
                                    i.setTransferDuration(hours + "h " + minutes + "m");

                                    // ✅ 计算总行程时长 (Leg2.Arrival - Leg1.Departure)
                                    Duration totalTrip = Duration.between(leg1.getDepartureTime(),
                                            leg2.getArrivalTime());
                                    i.setTotalDuration(totalTrip.toHours() + "h " + totalTrip.toMinutesPart() + "m");

                                    // ✅ 计算剩余座位（短板效应：取最小值）
                                    int minSeats = Math.min(
                                            r1.getRemainingSeats() != null ? r1.getRemainingSeats() : 0,
                                            r2.getRemainingSeats() != null ? r2.getRemainingSeats() : 0);
                                    i.setRemainingSeats(minSeats);

                                    interlineFlights.add(i);
                                }
                            }
                        }
                    }
                }
            }
        }

        FlightSearchResult result = new FlightSearchResult();
        result.setDirectFlights(new PageResult<>(flightPage.getTotal(), directFlights));
        result.setInterlineFlights(interlineFlights);
        return Result.ok(result);
    }

    private FlightSearchResponse convertToResponseOptimized(
            Flight f,
            String cabinType,
            Map<Long, Route> routeMap,
            Map<Long, List<AircraftCabinConfig>> configMap,
            Map<Long, Map<String, Integer>> seatMap,
            Map<Long, AircraftModel> modelMap) {

        Route route = routeMap.get(f.getRouteId());
        if (route == null)
            return null;

        List<AircraftCabinConfig> configs = configMap.getOrDefault(f.getModelId(), Collections.emptyList());
        if (StringUtils.hasText(cabinType)) {
            configs = configs.stream().filter(c -> c.getCabinType().equals(cabinType)).collect(Collectors.toList());
        }

        if (configs.isEmpty())
            return null;

        BigDecimal bestPrice = null;
        Integer bestSeats = 0;
        String bestCabin = null;
        AircraftCabinConfig bestConfig = null; // ✅ 记录最佳舱位配置

        Map<String, Integer> flightSeats = seatMap.getOrDefault(f.getFlightId(), Collections.emptyMap());

        for (AircraftCabinConfig cfg : configs) {
            BigDecimal price = route.getBasePrice();
            if (cfg.getCabinCoefficient() != null) {
                price = price.multiply(cfg.getCabinCoefficient());
            }

            // Check inventory using pre-fetched map
            Integer availableCount = flightSeats.getOrDefault(cfg.getCabinType(), 0);

            if (bestPrice == null || price.compareTo(bestPrice) < 0) {
                bestPrice = price;
                bestSeats = availableCount;
                bestCabin = cfg.getCabinType();
                bestConfig = cfg; // ✅ 保存配置
            }
        }

        if (bestPrice == null)
            return null;

        FlightSearchResponse dto = new FlightSearchResponse();
        dto.setFlightNo(f.getFlightNo());
        dto.setDeparturePlace(f.getDepartureCity());
        dto.setDestination(f.getArrivalCity());
        dto.setDepartureTime(f.getDepartureTime());
        dto.setArrivalTime(f.getArrivalTime());

        Duration duration = Duration.between(f.getDepartureTime(), f.getArrivalTime());
        long hours = duration.toHours();
        long minutes = duration.toMinutesPart();
        dto.setDuration(hours + "h " + minutes + "m");

        dto.setPrice(bestPrice);
        dto.setRemainingSeats(bestSeats);
        dto.setAirlineCompany(f.getAirlineCompany());
        dto.setCabinType(bestCabin);

        // ✅ 填充机型名称（联程航班）
        AircraftModel model = modelMap.get(f.getModelId());
        dto.setAircraftModel(model != null ? model.getModelName() : "Unknown");

        // ✅ 填充行李额度和服务信息
        if (bestConfig != null) {
            dto.setBaggageAllowance(bestConfig.getDefaultChecked());
            dto.setServices(bestConfig.getDefaultServices());
        }

        return dto;
    }

    private FlightSearchResponse convertToResponse(Flight f, String cabinType) {
        Route route = routeMapper.selectById(f.getRouteId());
        if (route == null)
            return null;

        List<AircraftCabinConfig> configs = cabinConfigMapper.selectList(Wrappers.<AircraftCabinConfig>lambdaQuery()
                .eq(AircraftCabinConfig::getModelId, f.getModelId())
                .eq(StringUtils.hasText(cabinType), AircraftCabinConfig::getCabinType, cabinType));

        if (configs.isEmpty())
            return null;

        BigDecimal bestPrice = null;
        Integer bestSeats = 0;
        String bestCabin = null;
        AircraftCabinConfig bestConfig = null; // ✅ 记录最佳舱位配置

        for (AircraftCabinConfig cfg : configs) {
            BigDecimal price = route.getBasePrice();
            if (cfg.getCabinCoefficient() != null) {
                price = price.multiply(cfg.getCabinCoefficient());
            }

            // Check inventory using SeatService
            // Count seats with status=1 (Available) for this flight and cabin
            long availableCount = seatService.count(Wrappers.<Seat>lambdaQuery()
                    .eq(Seat::getFlightId, f.getFlightId())
                    .eq(Seat::getCabinType, cfg.getCabinType())
                    .eq(Seat::getStatus, 1)); // 1=Available

            if (bestPrice == null || price.compareTo(bestPrice) < 0) {
                bestPrice = price;
                bestSeats = (int) availableCount;
                bestCabin = cfg.getCabinType();
                bestConfig = cfg; // ✅ 保存配置
            }
        }

        if (bestPrice == null)
            return null;

        FlightSearchResponse dto = new FlightSearchResponse();
        dto.setFlightNo(f.getFlightNo());
        dto.setDeparturePlace(f.getDepartureCity());
        dto.setDestination(f.getArrivalCity());
        dto.setDepartureTime(f.getDepartureTime());
        dto.setArrivalTime(f.getArrivalTime());

        Duration duration = Duration.between(f.getDepartureTime(), f.getArrivalTime());
        long hours = duration.toHours();
        long minutes = duration.toMinutesPart();
        dto.setDuration(hours + "h " + minutes + "m");

        dto.setPrice(bestPrice);
        dto.setRemainingSeats(bestSeats);
        dto.setAirlineCompany(f.getAirlineCompany());
        dto.setCabinType(bestCabin);

        // ✅ 填充机型名称（直飞航班）
        AircraftModel model = aircraftModelMapper.selectById(f.getModelId());
        dto.setAircraftModel(model != null ? model.getModelName() : "Unknown");

        // ✅ 填充行李额度和服务信息
        if (bestConfig != null) {
            dto.setBaggageAllowance(bestConfig.getDefaultChecked());
            dto.setServices(bestConfig.getDefaultServices());
        }

        return dto;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> createFlight(FlightCreateRequest req) {
        // 1. 基础校验
        Long exists = flightMapper.selectCount(Wrappers.<Flight>lambdaQuery()
                .eq(Flight::getFlightNo, req.getFlightNo())
                .eq(Flight::getDepartureTime, req.getDepartureTime()));
        if (exists != null && exists > 0) {
            return Result.fail(409, "flight already exists");
        }

        AircraftModel model = aircraftModelMapper.selectById(req.getModelId());
        if (model == null)
            return Result.fail(404, "aircraft model not found");

        Route route = routeMapper.selectById(req.getRouteId());
        if (route == null)
            return Result.fail(404, "route not found");

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
        if (rows <= 0)
            return Result.fail(500, "insert flight failed");

        // 5. 生成物理座位
        seatService.remove(Wrappers.<Seat>lambdaQuery().eq(Seat::getFlightId, f.getFlightId()));

        List<Seat> allSeats = new ArrayList<>();
        // 复用生成逻辑
        generateSeats(f, configs, allSeats);

        if (!allSeats.isEmpty()) {
            // 优化：使用原生 JDBC 批量插入，大幅提升性能
            int batchSize = 1000;
            for (int i = 0; i < allSeats.size(); i += batchSize) {
                int end = Math.min(i + batchSize, allSeats.size());
                seatMapper.insertBatch(allSeats.subList(i, end));
            }
        }

        return Result.ok(true);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> updateFlight(Long flightId, FlightCreateRequest req) {
        Flight f = flightMapper.selectById(flightId);
        if (f == null)
            return Result.fail(404, "flight not found");

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
                List<AircraftCabinConfig> configs = cabinConfigMapper
                        .selectList(Wrappers.<AircraftCabinConfig>lambdaQuery()
                                .eq(AircraftCabinConfig::getModelId, model.getModelId())
                                .eq(AircraftCabinConfig::getCabinLayoutNo, layoutNo));

                // D. 重新生成座位
                List<Seat> allSeats = new ArrayList<>();
                generateSeats(f, configs, allSeats); // 调用提取出来的公共方法

                if (!allSeats.isEmpty()) {
                    // 优化：使用原生 JDBC 批量插入
                    int batchSize = 1000;
                    for (int i = 0; i < allSeats.size(); i += batchSize) {
                        int end = Math.min(i + batchSize, allSeats.size());
                        seatMapper.insertBatch(allSeats.subList(i, end));
                    }
                }
            }
        }

        return Result.ok(true);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Boolean> deleteFlight(Long flightId) {
        // 检查是否有活跃订单
        long activeCount = seatService.count(Wrappers.<Seat>lambdaQuery()
                .eq(Seat::getFlightId, flightId)
                .in(Seat::getStatus, 2, 3));
        if (activeCount > 0) {
            return Result.fail(400, "该航班已有活跃订单，无法删除");
        }

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
            if (colLayout == null || colLayout.isEmpty())
                colLayout = "ABCDEF";

            int startRow = cfg.getStartRowNum() != null ? cfg.getStartRowNum() : 1;

            int seatsPerRow = colLayout.length();
            int totalRows = (int) Math.ceil((double) capacity / seatsPerRow);

            int generatedCount = 0;

            for (int r = 0; r < totalRows; r++) {
                int currentRow = startRow + r;
                for (int c = 0; c < seatsPerRow; c++) {
                    if (generatedCount >= capacity)
                        break;

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