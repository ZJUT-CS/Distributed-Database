import { request } from '../../../lib/axios';
import { POPULAR_AIRPORTS as AIRPORTS_CONST } from '../../../constants';
import type { Flight } from '../types';

const toCity = (loc: string) => {
  const byCode = AIRPORTS_CONST.find((a) => a.code === loc);
  if (byCode) return byCode.city;
  const byCity = AIRPORTS_CONST.find((a) => a.city === loc);
  return byCity ? byCity.city : loc;
};

export async function searchFlights(params: {
  origin: string;
  destination: string;
  departureDate: string;
}): Promise<Flight[]> {
  const o = (params.origin || '').trim();
  const d = (params.destination || '').trim();
  const dateStr = (params.departureDate || '').trim();
  if (!o || !d || !dateStr) throw new Error('查询参数不完整');

  const data = await request<
    Array<{
      flightNo: string;
      departurePlace: string;
      destination: string;
      departureTime: string;
      arrivalTime: string;
      duration: string;
      price?: number;
      remainingSeats?: number;
      airlineCompany?: string;
      cabinType?: string;
    }>
  >({
    method: 'GET',
    url: '/flights/search',
    params: {
      departurePlace: toCity(o),
      destination: toCity(d),
      departureDate: dateStr,
    },
  });

  return data.map((r) => ({
    id: r.flightNo || `${r.departurePlace}-${r.destination}-${r.departureTime}`,
    airline: r.airlineCompany || '',
    airlineCode: (r.flightNo || '').replace(/[^A-Z]/g, '').slice(0, 2),
    flightNumber: r.flightNo || '',
    cabinType: r.cabinType,
    origin: r.departurePlace,
    destination: r.destination,
    departureTime: r.departureTime,
    arrivalTime: r.arrivalTime,
    price: Number(r.price ?? 0),
    remainingSeats: typeof r.remainingSeats === 'number' ? r.remainingSeats : undefined,
    duration: r.duration || '',
    stops: 0,
    baggageWeight: 23,
    amenities: { hasPower: false, hasMeal: true, hasWifi: false, hasEntertainment: false },
    aircraft: undefined,
  }));
}

