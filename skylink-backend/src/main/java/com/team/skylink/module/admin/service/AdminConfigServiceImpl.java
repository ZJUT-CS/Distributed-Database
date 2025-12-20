package com.team.skylink.module.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.AdminConfigUpsertRequest;
import com.team.skylink.module.system.entity.SystemConfig;
import com.team.skylink.module.system.mapper.ConfigMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminConfigServiceImpl implements AdminConfigService {
    private final ConfigMapper configMapper;

    public AdminConfigServiceImpl(ConfigMapper configMapper) {
        this.configMapper = configMapper;
    }

    @Override
    public Result<PageResult<SystemConfig>> list(Integer page, Integer size, String keyword) {
        int p = page != null && page > 0 ? page : 1;
        int s = size != null && size > 0 ? Math.min(size, 100) : 10;
        int offset = (p - 1) * s;

        QueryWrapper<SystemConfig> qw = new QueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) {
            String k = keyword.trim();
            qw.and(w -> w.like("config_name", k).or().like("config_desc", k));
        }
        qw.orderByDesc("update_time").orderByDesc("config_id");

        Long total = configMapper.selectCount(qw);
        qw.last("limit " + offset + "," + s);
        List<SystemConfig> items = configMapper.selectList(qw);
        return Result.ok(new PageResult<>(total != null ? total : 0, items));
    }

    @Override
    public Result<SystemConfig> create(Long adminId, AdminConfigUpsertRequest body) {
        SystemConfig c = new SystemConfig();
        c.setConfigName(body.getConfigName());
        c.setConfigValue(body.getConfigValue());
        c.setConfigDesc(body.getConfigDesc());
        c.setEffectiveTime(body.getEffectiveTime());
        c.setOperAdminId(adminId != null ? adminId : 0);
        c.setUpdateTime(LocalDateTime.now());

        configMapper.insert(c);
        return Result.ok(c);
    }

    @Override
    public Result<Boolean> update(Long adminId, Long configId, AdminConfigUpsertRequest body) {
        if (configId == null) return Result.fail(400, "configId is required");
        SystemConfig c = configMapper.selectById(configId);
        if (c == null) return Result.fail(404, "config not found");

        c.setConfigName(body.getConfigName());
        c.setConfigValue(body.getConfigValue());
        c.setConfigDesc(body.getConfigDesc());
        c.setEffectiveTime(body.getEffectiveTime());
        c.setOperAdminId(adminId != null ? adminId : 0);
        c.setUpdateTime(LocalDateTime.now());

        int rows = configMapper.updateById(c);
        return Result.ok(rows > 0);
    }

    @Override
    public Result<Boolean> delete(Long configId) {
        if (configId == null) return Result.fail(400, "configId is required");
        int rows = configMapper.deleteById(configId);
        return Result.ok(rows > 0);
    }
}

