package com.team.skylink.module.system.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path dir = Paths.get(System.getProperty("user.dir"), "uploads");
        String location = "file:" + dir.toAbsolutePath().toString() + "/";
        registry.addResourceHandler("/uploads/**").addResourceLocations(location);
    }
}
