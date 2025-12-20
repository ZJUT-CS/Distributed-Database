package com.team.skylink.module.booking.service;

import com.team.skylink.module.booking.dto.BookingResponse;

import java.util.List;

public interface BookingService {
    List<BookingResponse> listBookings(Long userId);
}

