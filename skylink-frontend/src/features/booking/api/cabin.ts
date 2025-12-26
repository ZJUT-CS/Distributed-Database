import { request } from '@/shared/api/axios';

/**
 * 可用舱位配置
 */
export interface AvailableCabin {
    configId: number;
    cabinType: string;
    cabinName: string;
    availableSeats: number;
    coefficient: number;
    carryOn?: string;
    checked?: string;
    services?: string;
}

/**
 * 查询指定航班的可用舱位配置
 * GET /api/v1/cabins/available?flightId=360441346
 */
export async function getAvailableCabins(flightId: string | number): Promise<AvailableCabin[]> {
    const id = String(flightId ?? '').trim();
    if (!id) throw new Error('缺少航班ID');

    return request<AvailableCabin[]>({
        method: 'GET',
        url: '/api/v1/cabins/available',
        params: { flightId: id },
    });
}
