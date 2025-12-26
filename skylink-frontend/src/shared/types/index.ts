// =====================
// 通用 API 响应类型
// =====================

/** 标准 API 响应结构 */
export interface APIResponse<T> {
    code: number;
    message: string;
    data: T;
}

/** 分页请求参数 */
export interface PaginationParams {
    page: number;
    pageSize: number;
}

/** 分页响应结构 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

// =====================
// ⚠️ 注意：Feature 类型不再在此 Re-export
// 请直接从对应 Feature 导入以避免循环依赖：
// import { Flight } from '@/features/flight';
// import { User } from '@/features/auth';
// =====================

