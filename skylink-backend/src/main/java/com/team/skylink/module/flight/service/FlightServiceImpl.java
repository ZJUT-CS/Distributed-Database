package com.team.skylink.module.flight.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.module.flight.dto.CabinCreateRequest;
import com.team.skylink.module.flight.dto.FlightCreateRequest;
import com.team.skylink.module.flight.dto.FlightSearchResponse;
import com.team.skylink.module.flight.entity.Cabin;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.mapper.CabinMapper;
import com.team.skylink.module.flight.mapper.FlightMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class FlightServiceImpl implements FlightService {
    private final FlightMapper flightMapper;
    private final CabinMapper cabinMapper;

    public FlightServiceImpl(FlightMapper flightMapper, CabinMapper cabinMapper) {
        this.flightMapper = flightMapper;
        this.cabinMapper = cabinMapper;
    }

    @Override
    public Result<List<FlightSearchResponse>> search(
            String departurePlace,
            String destination,
            String flightNo,
            String airlineCompany,
            String cabinType,
            Integer status,
            LocalDate departureDate,
            LocalDateTime departureTimeFrom,
            LocalDateTime departureTimeTo
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
                r.setCabinType(cabin.getCabinType());
            }
            resp.add(r);
        }
        return Result.ok(resp);
    }

    @Override
    public Result<Boolean> createFlight(FlightCreateRequest req) {
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

    @Override
    public Result<Boolean> createCabin(CabinCreateRequest req) {
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

