package com.team.skylink.module.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.FlightPassengerDto;
import com.team.skylink.module.admin.dto.FlightPassengerQuery;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.user.entity.User;
import com.team.skylink.module.user.mapper.UserMapper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AdminFlightServiceImpl implements AdminFlightService {

    @Autowired
    private FlightMapper flightMapper;

    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private UserMapper userMapper;

    @Override
    public Result<PageResult<FlightPassengerDto>> listFlightPassengers(FlightPassengerQuery query) {
        QueryWrapper<Flight> flightQuery = new QueryWrapper<>();
        flightQuery.eq("flight_no", query.getFlightNo());
        Flight flight = flightMapper.selectOne(flightQuery);

        if (flight == null) {
            return Result.fail(404, "航班不存在");
        }

        QueryWrapper<Orders> orderQuery = new QueryWrapper<>();
        orderQuery.eq("flight_id", flight.getFlightId());
        orderQuery.ne("order_status", 5);

        if (query.getPassengerName() != null && !query.getPassengerName().trim().isEmpty()) {
            orderQuery.like("passenger_name", query.getPassengerName().trim());
        }
        if (query.getContactPhone() != null && !query.getContactPhone().trim().isEmpty()) {
            orderQuery.like("contact_phone", query.getContactPhone().trim());
        }

        orderQuery.orderByDesc("order_time");

        Page<Orders> page = new Page<>(query.getPage(), query.getSize());
        Page<Orders> orderPage = orderMapper.selectPage(page, orderQuery);

        List<FlightPassengerDto> passengerList = new ArrayList<>();
        for (Orders order : orderPage.getRecords()) {
            FlightPassengerDto dto = new FlightPassengerDto();
            BeanUtils.copyProperties(order, dto);
            dto.setOrderNo(order.getOrderId());
            dto.setFlightNo(flight.getFlightNo());
            dto.setFlightId(flight.getFlightId());
            dto.setDepartureCity(flight.getDepartureCity());
            dto.setDepartureAirport(flight.getDepartureAirport());
            dto.setArrivalCity(flight.getArrivalCity());
            dto.setArrivalAirport(flight.getArrivalAirport());
            dto.setDepartureTime(flight.getDepartureTime());
            dto.setArrivalTime(flight.getArrivalTime());
            dto.setCreateTime(order.getOrderTime());

            if (order.getUserId() != null) {
                User user = userMapper.selectById(order.getUserId());
                if (user != null) {
                    dto.setUserRealName(user.getRealName());
                    dto.setUserPhone(user.getPhoneNumber());
                    dto.setUserEmail(user.getEmail());
                }
            }

            passengerList.add(dto);
        }

        PageResult<FlightPassengerDto> pageResult = new PageResult<>(orderPage.getTotal(), passengerList);

        return Result.ok(pageResult);
    }
}
