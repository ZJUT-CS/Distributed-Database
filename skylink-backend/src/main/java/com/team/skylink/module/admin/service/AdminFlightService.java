package com.team.skylink.module.admin.service;

import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.FlightPassengerDto;
import com.team.skylink.module.admin.dto.FlightPassengerQuery;

public interface AdminFlightService {
    Result<PageResult<FlightPassengerDto>> listFlightPassengers(FlightPassengerQuery query);
}
