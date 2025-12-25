import { request } from '../../../lib/axios';

/**
 * 联程/多程预订请求参数
 * 对应后端 BookingRequest DTO
 */
export interface BookingRequest {
    /**
     * 航班ID列表
     * 单程: [1001]
     * 联程/多程: [1001, 1002]
     */
    flightIds: (string | number)[];

    /**
     * 所选舱位配置ID
     */
    cabinId?: string | number;

    /**
     * 乘客信息列表
     */
    passengers: PassengerInfo[];

    /**
     * 当前用户ID
     */
    userId: string | number;

    /**
     * 是否为联程票
     * true = 打包 (生成父子单)
     * false = 拼凑 (生成独立单)
     */
    isInterline?: boolean;
}

export interface PassengerInfo {
    name: string;
    idCard: string;
    phone?: string;  // ✅ 添加phone字段
}

/**
 * 联程预订响应
 */
export interface BookingResponse {
    /** 父订单ID（联程时存在） */
    parentOrderId?: string;
    /** 子订单ID列表 */
    orderIds: string[];
    /** 订单号列表 */
    orderNos?: string[];
    /** 总金额 */
    totalAmount?: number;
    /** 创建时间 */
    createTime?: string;
}

/**
 * 提交联程/多程预订
 * POST /api/v1/bookings
 */
export async function createBooking(body: BookingRequest): Promise<BookingResponse> {
    const userId = String(body.userId ?? '').trim();
    if (!userId) throw new Error('缺少 userId');

    if (!Array.isArray(body.flightIds) || body.flightIds.length === 0) {
        throw new Error('缺少航班ID列表');
    }

    if (!Array.isArray(body.passengers) || body.passengers.length === 0) {
        throw new Error('缺少乘客信息');
    }

    const result = await request<BookingResponse>({
        method: 'POST',
        url: '/api/v1/bookings',
        data: {
            userId: String(userId),
            flightIds: body.flightIds.map(id => String(id)),
            cabinId: body.cabinId ? String(body.cabinId) : undefined,
            passengers: body.passengers,
            isInterline: body.isInterline ?? (body.flightIds.length > 1),
        },
    });

    // 防御性处理
    return {
        parentOrderId: result?.parentOrderId,
        orderIds: Array.isArray(result?.orderIds) ? result.orderIds : [],
        orderNos: Array.isArray(result?.orderNos) ? result.orderNos : undefined,
        totalAmount: result?.totalAmount,
        createTime: result?.createTime,
    };
}

/**
 * 查询用户预订列表
 * GET /api/v1/bookings
 */
export async function listBookings(userId: string | number): Promise<BookingResponse[]> {
    const id = String(userId ?? '').trim();
    if (!id) throw new Error('缺少 userId');

    const result = await request<BookingResponse[]>({
        method: 'GET',
        url: '/api/v1/bookings',
        params: { userId: id },
    });

    return Array.isArray(result) ? result : [];
}
