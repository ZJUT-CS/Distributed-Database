package com.team.skylink.module.booking.service;

import com.team.skylink.common.Result;
import com.team.skylink.module.booking.dto.BookingRequest;
import com.team.skylink.module.booking.dto.BookingResponse;

import java.util.List;

import java.util.Map;

public interface BookingService {
    // 提交订单 (返回订单ID信息)
    Result<Map<String, Object>> submitBooking(BookingRequest req);

    // 查询订单列表 (保留你原有的)
    List<BookingResponse> listBookings(Long userId);
}