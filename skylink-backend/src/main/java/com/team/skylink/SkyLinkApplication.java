package com.team.skylink;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.mybatis.spring.annotation.MapperScan;

@SpringBootApplication
@MapperScan("com.team.skylink.infrastructure.persistence.mapper")
public class SkyLinkApplication {
    public static void main(String[] args) {
        SpringApplication.run(SkyLinkApplication.class, args);
    }
}

