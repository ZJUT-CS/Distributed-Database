package com.team.skylink;

import org.apache.ibatis.annotations.Mapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.mybatis.spring.annotation.MapperScan;

@SpringBootApplication
@MapperScan(basePackages = "com.team.skylink", annotationClass = Mapper.class)
@EnableCaching
@org.springframework.scheduling.annotation.EnableScheduling
public class SkyLinkApplication {
    public static void main(String[] args) {
        SpringApplication.run(SkyLinkApplication.class, args);
    }
}
