package com.team.skylink.module.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.aircraft.entity.AircraftModel;
import com.team.skylink.module.aircraft.mapper.AircraftModelMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admins/aircraft-models")
public class AdminAircraftModelController {

    private final AircraftModelMapper aircraftModelMapper;

    public AdminAircraftModelController(AircraftModelMapper aircraftModelMapper) {
        this.aircraftModelMapper = aircraftModelMapper;
    }

    @GetMapping
    public Result<PageResult<AircraftModel>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String keyword
    ) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<PageResult<AircraftModel>>) adminGuard;

        int offset = (page - 1) * size;
        LambdaQueryWrapper<AircraftModel> qw = Wrappers.lambdaQuery();
        if (StringUtils.hasText(keyword)) {
            qw.and(i -> i.like(AircraftModel::getModelName, keyword)
                    .or().like(AircraftModel::getManufacturer, keyword));
        }

        Long total = aircraftModelMapper.selectCount(qw);
        qw.orderByDesc(AircraftModel::getModelId);
        qw.last("limit " + offset + "," + size);
        List<AircraftModel> list = aircraftModelMapper.selectList(qw);

        return Result.ok(new PageResult<>(total, list));
    }

    @PostMapping
    public Result<AircraftModel> create(HttpServletRequest request, @RequestBody AircraftModel body) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<AircraftModel>) adminGuard;

        if (body == null || !StringUtils.hasText(body.getModelName())) {
            return Result.fail(400, "missing modelName");
        }
        if (body.getTotalPhysicalSeats() == null || body.getTotalPhysicalSeats() <= 0) {
            return Result.fail(400, "invalid totalPhysicalSeats");
        }

        AircraftModel model = new AircraftModel();
        model.setModelName(body.getModelName().trim());
        model.setManufacturer(StringUtils.hasText(body.getManufacturer()) ? body.getManufacturer().trim() : null);
        model.setTotalPhysicalSeats(body.getTotalPhysicalSeats());
        aircraftModelMapper.insert(model);

        return Result.ok(model);
    }

    @PutMapping("/{modelId}")
    public Result<Boolean> update(HttpServletRequest request, @PathVariable("modelId") Long modelId, @RequestBody AircraftModel body) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        if (modelId == null) return Result.fail(400, "missing modelId");
        if (body == null) return Result.ok(Boolean.TRUE);

        LambdaUpdateWrapper<AircraftModel> uw = Wrappers.lambdaUpdate();
        uw.eq(AircraftModel::getModelId, modelId);
        boolean hasAny = false;

        if (body.getModelName() != null) {
            uw.set(AircraftModel::getModelName, StringUtils.hasText(body.getModelName()) ? body.getModelName().trim() : null);
            hasAny = true;
        }
        if (body.getManufacturer() != null) {
            uw.set(AircraftModel::getManufacturer, StringUtils.hasText(body.getManufacturer()) ? body.getManufacturer().trim() : null);
            hasAny = true;
        }
        if (body.getTotalPhysicalSeats() != null) {
            if (body.getTotalPhysicalSeats() <= 0) return Result.fail(400, "invalid totalPhysicalSeats");
            uw.set(AircraftModel::getTotalPhysicalSeats, body.getTotalPhysicalSeats());
            hasAny = true;
        }

        if (!hasAny) return Result.ok(Boolean.TRUE);
        int updated = aircraftModelMapper.update(null, uw);
        return Result.ok(updated > 0);
    }

    @DeleteMapping("/{modelId}")
    public Result<Boolean> delete(HttpServletRequest request, @PathVariable("modelId") Long modelId) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        if (modelId == null) return Result.fail(400, "missing modelId");
        int deleted = aircraftModelMapper.deleteById(modelId);
        return Result.ok(deleted > 0);
    }

    private static Result<?> ensureAdmin(HttpServletRequest request) {
        String t = request.getHeader("X-User-Type");
        if (t == null || !"2".equals(t.trim())) {
            return Result.fail(403, "admin required");
        }
        return null;
    }
}
