package com.example.demo.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

public class User {
    // 对应 user_id BIGINT
    private Long userId;
    // 对应 phone_number VARCHAR
    private String phoneNumber;
    // 对应 password_hash VARCHAR
    private String passwordHash;
    // 对应 real_name VARCHAR
    private String realName;
    // 对应 email VARCHAR
    private String email;
    // 对应 id_card VARCHAR
    private String idCard;
    // 对应 gender TINYINT (Java用Integer)
    private Integer gender;
    // 对应 birth_date DATE (Java用LocalDate)
    private LocalDate birthDate;
    public String getPasswordHash() {
        return passwordHash;
    }
    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }
    public String getRealName() {
        return realName;
    }
    public void setRealName(String realName) {
        this.realName = realName;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public String getIdCard() {
        return idCard;
    }
    public void setIdCard(String idCard) {
        this.idCard = idCard;
    }
    public Integer getGender() {
        return gender;
    }
    public void setGender(Integer gender) {
        this.gender = gender;
    }
    public LocalDate getBirthDate() {
        return birthDate;
    }
    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }
    public Integer getUserStatus() {
        return userStatus;
    }
    public void setUserStatus(Integer userStatus) {
        this.userStatus = userStatus;
    }
    public Long getRegisterTime() {
        return registerTime;
    }
    public void setRegisterTime(Long registerTime) {
        this.registerTime = registerTime;
    }
    public Long getLastLoginTime() {
        return lastLoginTime;
    }
    public void setLastLoginTime(Long lastLoginTime) {
        this.lastLoginTime = lastLoginTime;
    }
    // 对应 user_status TINYINT
    private Integer userStatus;
    // 对应 register_time BIGINT (时间戳)
    private Long registerTime;
    // 对应 last_login_time BIGINT
    private Long lastLoginTime;

    // === 必须生成 Getter 和 Setter 方法 (VS Code 右键 -> Source Action -> Generate Getters and Setters) ===
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    // ... 请把剩下的 Getter/Setter 补全 ...
}