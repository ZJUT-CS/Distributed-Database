package com.team.skylink.module.flight.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.team.skylink.module.flight.entity.Seat;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SeatMapper extends BaseMapper<Seat> {

    /**
     * 查询可用座位并加行锁 (排他锁)
     * Limit限制数量
     */
    @Select("SELECT * FROM seat WHERE flight_id = #{flightId} AND cabin_type = #{cabinType} AND status = 1 ORDER BY seat_id LIMIT #{limit} FOR UPDATE")
    List<Seat> selectAvailableSeatsForUpdate(@Param("flightId") Long flightId, @Param("cabinType") String cabinType, @Param("limit") int limit);

    @Select("<script>" +
            "SELECT flight_id as flightId, cabin_type as cabinType, COUNT(*) as count " +
            "FROM seat " +
            "WHERE status = 1 AND flight_id IN " +
            "<foreach item='item' index='index' collection='flightIds' open='(' separator=',' close=')'>" +
            "#{item}" +
            "</foreach>" +
            "GROUP BY flight_id, cabin_type" +
            "</script>")
    List<java.util.Map<String, Object>> countAvailableSeatsBatch(@Param("flightIds") List<Long> flightIds);
}

