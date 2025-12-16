package com.team.skylink.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.dto.FlightSearchResponse;
import com.team.skylink.entity.Cabin;
import com.team.skylink.entity.Flight;
import com.team.skylink.mapper.CabinMapper;
import com.team.skylink.mapper.FlightMapper;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.team.skylink.dto.FlightCreateRequest;
import com.team.skylink.dto.CabinCreateRequest;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/flights")
public class FlightController {
    private final FlightMapper flightMapper;
    private final CabinMapper cabinMapper;

    public FlightController(FlightMapper flightMapper, CabinMapper cabinMapper) {
        this.flightMapper = flightMapper;
        this.cabinMapper = cabinMapper;
    }

    @GetMapping("/search")
    public Result<List<FlightSearchResponse>> search(
            @RequestParam(required = false) String departurePlace,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) String flightNo,
            @RequestParam(required = false) String airlineCompany,
            @RequestParam(required = false) String cabinType,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate departureDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime departureTimeFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime departureTimeTo
    ) {
        QueryWrapper<Flight> qw = new QueryWrapper<>();
        if (departurePlace != null && !departurePlace.isEmpty()) {
            qw.like("departure_place", departurePlace);
        }
        if (destination != null && !destination.isEmpty()) {
            qw.like("destination", destination);
        }
        if (flightNo != null && !flightNo.isEmpty()) {
            qw.eq("flight_no", flightNo);
        }
        if (airlineCompany != null && !airlineCompany.isEmpty()) {
            qw.like("airline_company", airlineCompany);
        }
        if (status != null) {
            qw.eq("status", status);
        }
        if (departureDate != null) {
            LocalDateTime start = departureDate.atStartOfDay();
            LocalDateTime end = departureDate.plusDays(1).atStartOfDay().minusSeconds(1);
            qw.between("departure_time", start, end);
        }
        if (departureTimeFrom != null && departureTimeTo != null) {
            qw.between("departure_time", departureTimeFrom, departureTimeTo);
        } else if (departureTimeFrom != null) {
            qw.ge("departure_time", departureTimeFrom);
        } else if (departureTimeTo != null) {
            qw.le("departure_time", departureTimeTo);
        }

        List<Flight> flights = flightMapper.selectList(qw);
        List<FlightSearchResponse> resp = new ArrayList<>();
        for (Flight f : flights) {
            Cabin cabin = null;
            if (cabinType != null && !cabinType.isEmpty()) {
                cabin = cabinMapper.selectOne(new QueryWrapper<Cabin>()
                        .eq("flight_id", f.getFlightId())
                        .eq("cabin_type", cabinType));
            } else {
                List<Cabin> cabins = cabinMapper.selectList(new QueryWrapper<Cabin>()
                        .eq("flight_id", f.getFlightId()));
                BigDecimal minPrice = null;
                for (Cabin c : cabins) {
                    if (minPrice == null || c.getPrice().compareTo(minPrice) < 0) {
                        minPrice = c.getPrice();
                        cabin = c;
                    }
                }
            }
            FlightSearchResponse r = new FlightSearchResponse();
            r.setFlightNo(f.getFlightNo());
            r.setDeparturePlace(f.getDeparturePlace());
            r.setDestination(f.getDestination());
            r.setDepartureTime(f.getDepartureTime());
            r.setArrivalTime(f.getArrivalTime());
            Duration d = Duration.between(f.getDepartureTime(), f.getArrivalTime());
            long hours = d.toHours();
            long minutes = d.toMinutes() % 60;
            r.setDuration(hours + "小时 " + minutes + "分");
            r.setAirlineCompany(f.getAirlineCompany());
            if (cabin != null) {
                r.setPrice(cabin.getPrice());
                r.setRemainingSeats(cabin.getRemainingSeats());
            }
            resp.add(r);
        }
        return Result.ok(resp);
    }

    @PostMapping("/create")
    public Result<Boolean> createFlight(@RequestBody FlightCreateRequest req) {
        if (req.getFlightNo() == null || req.getDeparturePlace() == null || req.getDestination() == null
                || req.getDepartureTime() == null || req.getArrivalTime() == null || req.getAirlineCompany() == null
                || req.getTotalSeats() == null || req.getStatus() == null) {
            return Result.fail(400, "invalid params");
        }
        Flight exists = flightMapper.selectOne(new QueryWrapper<Flight>().eq("flight_no", req.getFlightNo()));
        if (exists != null) {
            return Result.fail(409, "flight already exists");
        }
        Flight f = new Flight();
        f.setFlightNo(req.getFlightNo());
        f.setDeparturePlace(req.getDeparturePlace());
        f.setDestination(req.getDestination());
        f.setDepartureTime(req.getDepartureTime());
        f.setArrivalTime(req.getArrivalTime());
        f.setAirlineCompany(req.getAirlineCompany());
        f.setTotalSeats(req.getTotalSeats());
        f.setStatus(req.getStatus());
        f.setCreateTime(LocalDateTime.now());
        f.setUpdateTime(LocalDateTime.now());
        int rows = flightMapper.insert(f);
        return Result.ok(rows > 0);
    }

    @PostMapping("/cabins/create")
    public Result<Boolean> createCabin(@RequestBody CabinCreateRequest req) {
        if (req.getFlightNo() == null || req.getCabinType() == null || req.getPrice() == null || req.getRemainingSeats() == null) {
            return Result.fail(400, "invalid params");
        }
        Flight f = flightMapper.selectOne(new QueryWrapper<Flight>().eq("flight_no", req.getFlightNo()));
        if (f == null) {
            return Result.fail(404, "flight not found");
        }
        Cabin exists = cabinMapper.selectOne(new QueryWrapper<Cabin>().eq("flight_id", f.getFlightId()).eq("cabin_type", req.getCabinType()));
        if (exists != null) {
            return Result.fail(409, "cabin already exists");
        }
        Cabin c = new Cabin();
        c.setFlightId(f.getFlightId());
        c.setCabinType(req.getCabinType());
        c.setPrice(req.getPrice());
        c.setRemainingSeats(req.getRemainingSeats());
        c.setCreateTime(LocalDateTime.now());
        c.setUpdateTime(LocalDateTime.now());
        int rows = cabinMapper.insert(c);
        return Result.ok(rows > 0);
    }
}
