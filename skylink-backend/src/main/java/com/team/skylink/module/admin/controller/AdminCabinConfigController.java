package com.team.skylink.module.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import com.team.skylink.module.aircraft.entity.AircraftModel;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper;
import com.team.skylink.module.aircraft.mapper.AircraftModelMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admins/cabin-configs")
public class AdminCabinConfigController {

    private final AircraftCabinConfigMapper cabinConfigMapper;
    private final AircraftModelMapper aircraftModelMapper;

    public AdminCabinConfigController(AircraftCabinConfigMapper cabinConfigMapper, AircraftModelMapper aircraftModelMapper) {
        this.cabinConfigMapper = cabinConfigMapper;
        this.aircraftModelMapper = aircraftModelMapper;
    }

    @GetMapping
    public Result<PageResult<CabinConfigItem>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long modelId,
            @RequestParam(required = false) String cabinType
    ) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<PageResult<CabinConfigItem>>) adminGuard;

        int offset = (page - 1) * size;
        LambdaQueryWrapper<AircraftCabinConfig> qw = Wrappers.lambdaQuery();
        if (modelId != null) qw.eq(AircraftCabinConfig::getModelId, modelId);
        if (StringUtils.hasText(cabinType)) qw.eq(AircraftCabinConfig::getCabinType, cabinType.trim().toUpperCase());

        Long total = cabinConfigMapper.selectCount(qw);
        qw.orderByDesc(AircraftCabinConfig::getConfigId);
        qw.last("limit " + offset + "," + size);
        List<AircraftCabinConfig> list = cabinConfigMapper.selectList(qw);

        Map<Long, String> modelNameMap = toModelNameMap(list);
        List<CabinConfigItem> data = list.stream().map(cfg -> CabinConfigItem.from(cfg, modelNameMap.get(cfg.getModelId()))).collect(Collectors.toList());

        return Result.ok(new PageResult<>(total, data));
    }

    @PostMapping
    public Result<CabinConfigItem> create(HttpServletRequest request, @RequestBody AircraftCabinConfig body) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<CabinConfigItem>) adminGuard;

        if (body == null) return Result.fail(400, "missing body");
        if (body.getModelId() == null) return Result.fail(400, "missing modelId");
        if (!StringUtils.hasText(body.getCabinType())) return Result.fail(400, "missing cabinType");
        if (body.getCabinCoefficient() == null) return Result.fail(400, "missing cabinCoefficient");
        if (body.getCabinLayoutNo() == null) return Result.fail(400, "missing cabinLayoutNo");
        if (body.getCapacity() == null || body.getCapacity() <= 0) return Result.fail(400, "invalid capacity");
        if (body.getStartRowNum() == null || body.getStartRowNum() <= 0) return Result.fail(400, "invalid startRowNum");
        if (!StringUtils.hasText(body.getSeatColLayout())) return Result.fail(400, "missing seatColLayout");

        AircraftModel model = aircraftModelMapper.selectById(body.getModelId());
        if (model == null) return Result.fail(404, "aircraft model not found");

        AircraftCabinConfig cfg = new AircraftCabinConfig();
        cfg.setModelId(body.getModelId());
        cfg.setCabinType(body.getCabinType().trim().toUpperCase());
        cfg.setCabinCoefficient(body.getCabinCoefficient());
        cfg.setCabinLayoutNo(body.getCabinLayoutNo());
        cfg.setCapacity(body.getCapacity());
        cfg.setStartRowNum(body.getStartRowNum());
        cfg.setSeatColLayout(body.getSeatColLayout().trim().toUpperCase());
        cfg.setDefaultCarryOn(StringUtils.hasText(body.getDefaultCarryOn()) ? body.getDefaultCarryOn().trim() : null);
        cfg.setDefaultChecked(StringUtils.hasText(body.getDefaultChecked()) ? body.getDefaultChecked().trim() : null);
        cfg.setDefaultServices(StringUtils.hasText(body.getDefaultServices()) ? body.getDefaultServices().trim() : null);
        cabinConfigMapper.insert(cfg);

        return Result.ok(CabinConfigItem.from(cfg, model.getModelName()));
    }

    @PutMapping("/{configId}")
    public Result<Boolean> update(HttpServletRequest request, @PathVariable("configId") Long configId, @RequestBody AircraftCabinConfig body) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        if (configId == null) return Result.fail(400, "missing configId");
        if (body == null) return Result.ok(Boolean.TRUE);

        LambdaUpdateWrapper<AircraftCabinConfig> uw = Wrappers.lambdaUpdate();
        uw.eq(AircraftCabinConfig::getConfigId, configId);
        boolean hasAny = false;

        if (body.getModelId() != null) {
            AircraftModel model = aircraftModelMapper.selectById(body.getModelId());
            if (model == null) return Result.fail(404, "aircraft model not found");
            uw.set(AircraftCabinConfig::getModelId, body.getModelId());
            hasAny = true;
        }
        if (body.getCabinType() != null) {
            uw.set(AircraftCabinConfig::getCabinType, StringUtils.hasText(body.getCabinType()) ? body.getCabinType().trim().toUpperCase() : null);
            hasAny = true;
        }
        if (body.getCabinCoefficient() != null) {
            uw.set(AircraftCabinConfig::getCabinCoefficient, body.getCabinCoefficient());
            hasAny = true;
        }
        if (body.getCabinLayoutNo() != null) {
            uw.set(AircraftCabinConfig::getCabinLayoutNo, body.getCabinLayoutNo());
            hasAny = true;
        }
        if (body.getCapacity() != null) {
            if (body.getCapacity() <= 0) return Result.fail(400, "invalid capacity");
            uw.set(AircraftCabinConfig::getCapacity, body.getCapacity());
            hasAny = true;
        }
        if (body.getStartRowNum() != null) {
            if (body.getStartRowNum() <= 0) return Result.fail(400, "invalid startRowNum");
            uw.set(AircraftCabinConfig::getStartRowNum, body.getStartRowNum());
            hasAny = true;
        }
        if (body.getSeatColLayout() != null) {
            uw.set(AircraftCabinConfig::getSeatColLayout, StringUtils.hasText(body.getSeatColLayout()) ? body.getSeatColLayout().trim().toUpperCase() : null);
            hasAny = true;
        }
        if (body.getDefaultCarryOn() != null) {
            uw.set(AircraftCabinConfig::getDefaultCarryOn, StringUtils.hasText(body.getDefaultCarryOn()) ? body.getDefaultCarryOn().trim() : null);
            hasAny = true;
        }
        if (body.getDefaultChecked() != null) {
            uw.set(AircraftCabinConfig::getDefaultChecked, StringUtils.hasText(body.getDefaultChecked()) ? body.getDefaultChecked().trim() : null);
            hasAny = true;
        }
        if (body.getDefaultServices() != null) {
            uw.set(AircraftCabinConfig::getDefaultServices, StringUtils.hasText(body.getDefaultServices()) ? body.getDefaultServices().trim() : null);
            hasAny = true;
        }

        if (!hasAny) return Result.ok(Boolean.TRUE);
        int updated = cabinConfigMapper.update(null, uw);
        return Result.ok(updated > 0);
    }

    @DeleteMapping("/{configId}")
    public Result<Boolean> delete(HttpServletRequest request, @PathVariable("configId") Long configId) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        if (configId == null) return Result.fail(400, "missing configId");
        int deleted = cabinConfigMapper.deleteById(configId);
        return Result.ok(deleted > 0);
    }

    private Map<Long, String> toModelNameMap(List<AircraftCabinConfig> list) {
        Set<Long> ids = list.stream().map(AircraftCabinConfig::getModelId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (ids.isEmpty()) return Collections.emptyMap();
        List<AircraftModel> models = aircraftModelMapper.selectBatchIds(ids);
        Map<Long, String> map = new HashMap<>();
        for (AircraftModel m : models) {
            map.put(m.getModelId(), m.getModelName());
        }
        return map;
    }

    @Data
    public static class CabinConfigItem {
        private Long configId;
        private Long modelId;
        private String cabinType;
        private Object cabinCoefficient;
        private Integer cabinLayoutNo;
        private Integer capacity;
        private Integer startRowNum;
        private String seatColLayout;
        private String defaultCarryOn;
        private String defaultChecked;
        private String defaultServices;
        private String modelName;

        public static CabinConfigItem from(AircraftCabinConfig cfg, String modelName) {
            CabinConfigItem r = new CabinConfigItem();
            r.setConfigId(cfg.getConfigId());
            r.setModelId(cfg.getModelId());
            r.setCabinType(cfg.getCabinType());
            r.setCabinCoefficient(cfg.getCabinCoefficient());
            r.setCabinLayoutNo(cfg.getCabinLayoutNo());
            r.setCapacity(cfg.getCapacity());
            r.setStartRowNum(cfg.getStartRowNum());
            r.setSeatColLayout(cfg.getSeatColLayout());
            r.setDefaultCarryOn(cfg.getDefaultCarryOn());
            r.setDefaultChecked(cfg.getDefaultChecked());
            r.setDefaultServices(cfg.getDefaultServices());
            r.setModelName(modelName);
            return r;
        }
    }

    private static Result<?> ensureAdmin(HttpServletRequest request) {
        String t = request.getHeader("X-User-Type");
        if (t == null || !"2".equals(t.trim())) {
            return Result.fail(403, "admin required");
        }
        return null;
    }
}
