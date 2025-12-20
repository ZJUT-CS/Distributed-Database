package com.team.skylink.module.refund.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.refund.dto.RefundChangeApplyRequest;
import com.team.skylink.module.refund.dto.RefundChangeSearchResponse;
import com.team.skylink.module.refund.service.RefundChangeService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/refund-change", "/api/v1/refund-change"})
public class RefundChangeController {
    private final RefundChangeService refundChangeService;

    public RefundChangeController(RefundChangeService refundChangeService) {
        this.refundChangeService = refundChangeService;
    }

    @GetMapping("/search")
    public Result<List<RefundChangeSearchResponse>> search(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long orderNo
    ) {
        return refundChangeService.search(userId, orderNo);
    }

    @PostMapping("/apply")
    public Result<Long> apply(@Valid @RequestBody RefundChangeApplyRequest req) {
        return refundChangeService.apply(req);
    }

    @PostMapping("/{recordId}/approve")
    public Result<Boolean> approve(@PathVariable("recordId") Long recordId) {
        return refundChangeService.approve(recordId);
    }

    @PostMapping("/{recordId}/reject")
    public Result<Boolean> reject(@PathVariable("recordId") Long recordId) {
        return refundChangeService.reject(recordId);
    }

    @DeleteMapping("/{recordId}")
    public Result<Boolean> revoke(@PathVariable("recordId") Long recordId) {
        return refundChangeService.revoke(recordId);
    }

    @PutMapping("/{recordId}")
    public Result<Boolean> updatePending(@PathVariable("recordId") Long recordId, @RequestBody RefundChangeApplyRequest req) {
        return refundChangeService.updatePending(recordId, req);
    }
}
