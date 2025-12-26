import { request } from '@/lib/axios';

export type RouteDictItem = {
  routeId: number;
  departureCity: string;
  departureAirport: string;
  arrivalCity: string;
  arrivalAirport: string;
  estimatedDuration?: number | null;
  distanceKm?: number | null;
  updateTime?: string | null;
};

export type RouteDictResponse = {
  version: string;
  routes: RouteDictItem[];
};

export const getRouteDict = () => {
  return request<RouteDictResponse>({ method: 'GET', url: '/api/v1/routes/dict' });
};
