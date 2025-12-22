package com.team.skylink.module.booking.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.booking.dto.BookingRequest;
import com.team.skylink.module.booking.dto.BookingResponse;
import com.team.skylink.module.booking.service.BookingService;
import jakarta.validation.constraints.NotNull;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {
    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // 新增：提交订单 (下单接口)
    @PostMapping
    public Result<Boolean> submitBooking(@RequestBody BookingRequest req) {
        return bookingService.submitBooking(req);
    }

    // 保留：查询列表
    @GetMapping
    public Result<List<BookingResponse>> listBookings(@RequestParam @NotNull(message = "userId is required") Long userId) {
        return Result.ok(bookingService.listBookings(userId));
    }
}