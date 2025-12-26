package com.team.skylink.module.flight.dto;

import lombok.Data;
import java.util.List;
import com.team.skylink.common.PageResult;

@Data
public class FlightSearchResult {
    private PageResult<FlightSearchResponse> directFlights;
    private List<InterlineFlightResponse> interlineFlights;
}
