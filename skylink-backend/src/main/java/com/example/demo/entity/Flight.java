package com.example.demo.entity;

import java.math.BigDecimal;

public class Flight {
    private Long flightId;
    public Long getFlightId() {
        return flightId;
    }
    public void setFlightId(Long flightId) {
        this.flightId = flightId;
    }
    public String getFlightNumber() {
        return flightNumber;
    }
    public void setFlightNumber(String flightNumber) {
        this.flightNumber = flightNumber;
    }
    public String getAirline() {
        return airline;
    }
    public void setAirline(String airline) {
        this.airline = airline;
    }
    public String getDepartureCity() {
        return departureCity;
    }
    public void setDepartureCity(String departureCity) {
        this.departureCity = departureCity;
    }
    public String getDepartureAirport() {
        return departureAirport;
    }
    public void setDepartureAirport(String departureAirport) {
        this.departureAirport = departureAirport;
    }
    public String getArrivalCity() {
        return arrivalCity;
    }
    public void setArrivalCity(String arrivalCity) {
        this.arrivalCity = arrivalCity;
    }
    public String getArrivalAirport() {
        return arrivalAirport;
    }
    public void setArrivalAirport(String arrivalAirport) {
        this.arrivalAirport = arrivalAirport;
    }
    public Long getDepartureTime() {
        return departureTime;
    }
    public void setDepartureTime(Long departureTime) {
        this.departureTime = departureTime;
    }
    public Long getArrivalTime() {
        return arrivalTime;
    }
    public void setArrivalTime(Long arrivalTime) {
        this.arrivalTime = arrivalTime;
    }
    public Integer getFlightDuration() {
        return flightDuration;
    }
    public void setFlightDuration(Integer flightDuration) {
        this.flightDuration = flightDuration;
    }
    public String getAircraftType() {
        return aircraftType;
    }
    public void setAircraftType(String aircraftType) {
        this.aircraftType = aircraftType;
    }
    public Integer getTotalSeats() {
        return totalSeats;
    }
    public void setTotalSeats(Integer totalSeats) {
        this.totalSeats = totalSeats;
    }
    public Integer getAvailableSeats() {
        return availableSeats;
    }
    public void setAvailableSeats(Integer availableSeats) {
        this.availableSeats = availableSeats;
    }
    public BigDecimal getEconomyPrice() {
        return economyPrice;
    }
    public void setEconomyPrice(BigDecimal economyPrice) {
        this.economyPrice = economyPrice;
    }
    public BigDecimal getBusinessPrice() {
        return businessPrice;
    }
    public void setBusinessPrice(BigDecimal businessPrice) {
        this.businessPrice = businessPrice;
    }
    public BigDecimal getFirstClassPrice() {
        return firstClassPrice;
    }
    public void setFirstClassPrice(BigDecimal firstClassPrice) {
        this.firstClassPrice = firstClassPrice;
    }
    public Integer getFlightStatus() {
        return flightStatus;
    }
    public void setFlightStatus(Integer flightStatus) {
        this.flightStatus = flightStatus;
    }
    public Long getCreateTime() {
        return createTime;
    }
    public void setCreateTime(Long createTime) {
        this.createTime = createTime;
    }
    public Long getUpdateTime() {
        return updateTime;
    }
    public void setUpdateTime(Long updateTime) {
        this.updateTime = updateTime;
    }
    private String flightNumber;
    private String airline;
    private String departureCity;
    private String departureAirport;
    private String arrivalCity;
    private String arrivalAirport;
    private Long departureTime;
    private Long arrivalTime;
    private Integer flightDuration;
    private String aircraftType;
    private Integer totalSeats;
    private Integer availableSeats;
    
    // ⚠️ 注意：钱一定要用 BigDecimal
    private BigDecimal economyPrice;
    private BigDecimal businessPrice;
    private BigDecimal firstClassPrice;
    
    private Integer flightStatus;
    private Long createTime;
    private Long updateTime;

    // === 同样，请生成所有字段的 Getter 和 Setter ===
}