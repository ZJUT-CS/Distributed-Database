package com.example.demo.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import com.example.demo.entity.Flight;
import java.util.List;

@Mapper
public interface FlightMapper {

    // 1. 查询所有航班
    @Select("SELECT * FROM flights LIMIT 10")
    List<Flight> findAllFlights();

    // 2. 根据出发地和目的地查询
    @Select("SELECT * FROM flights WHERE departure_city = #{dep} AND arrival_city = #{arr}")
    List<Flight> findFlightsByRoute(String dep, String arr);
}