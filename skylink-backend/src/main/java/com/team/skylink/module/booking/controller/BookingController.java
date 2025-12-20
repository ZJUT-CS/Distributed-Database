package com.team.skylink.module.booking.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.booking.dto.BookingResponse;
import com.team.skylink.module.booking.service.BookingService;
import jakarta.validation.constraints.NotNull;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping({"/api/v1/bookings"})
public class BookingController {
    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public Result<List<BookingResponse>> listBookings(@RequestParam @NotNull(message = "userId is required") Long userId) {
        return Result.ok(bookingService.listBookings(userId));
    }
}
