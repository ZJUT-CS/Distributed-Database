import { request } from '../../../lib/axios';

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
 * GET /api/v1/cabins/available?flightNo=CA4479
 */
export async function getAvailableCabins(flightNo: string | number): Promise<AvailableCabin[]> {
    const no = String(flightNo ?? '').trim();
    if (!no) throw new Error('缺少航班号');

    return request<AvailableCabin[]>({
        method: 'GET',
        url: '/api/v1/cabins/available',
        params: { flightNo: no },
    });
}
