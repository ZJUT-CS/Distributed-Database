package com.team.skylink.module.refund.service;

import com.team.skylink.common.Result;
import com.team.skylink.module.refund.dto.RefundChangeApplyRequest;
import com.team.skylink.module.refund.dto.RefundChangeSearchResponse;

import java.util.List;

public interface RefundChangeService {
    Result<List<RefundChangeSearchResponse>> search(Long userId, Long orderNo);

    Result<Long> apply(RefundChangeApplyRequest req);

    Result<Boolean> approve(Long recordId);

    Result<Boolean> reject(Long recordId);

    Result<Boolean> revoke(Long recordId);

    Result<Boolean> updatePending(Long recordId, RefundChangeApplyRequest req);
}

