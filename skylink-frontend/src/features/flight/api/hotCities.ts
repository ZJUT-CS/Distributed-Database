import { request } from '@/shared/api/axios';

export interface HotCity {
    cityName: string;
    mainAirport: string;
    dailyDepartures: number;
    weeklyGmv: number;
    currentLoad: number;
    alertLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}

export interface HotCitiesResponse {
    version: string;
    cities: HotCity[];
}

/**
 * 获取热门城市列表
 * 用于在地图上展示可选择的热门目的地
 */
export async function getHotCities(): Promise<HotCitiesResponse> {
    return request<HotCitiesResponse>({
        method: 'GET',
        url: '/api/v1/routes/cities/dict',
    });
}
