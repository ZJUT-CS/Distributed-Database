package com.team.skylink.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum TripTypeEnum {
    INDEPENDENT(0, "独立/单程"),   // 这种票退改互不影响
    INTERLINE_FIRST(1, "联程首段"), // 这种票必须按顺序用
    INTERLINE_NEXT(2, "联程后续");  // 这种票依附于首段

    private final int code;
    private final String desc;
}