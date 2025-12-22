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

  const data = await request<{
    directFlights?: {
      total: number;
      data: Array<{
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
      }>;
    };
    interlineFlights?: Array<{
      segments: Array<{
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
      }>;
      totalPrice?: number;
      transferCity?: string;
      transferDuration?: string;
    }>;
  }>({
    method: 'GET',
    url: '/api/v1/flights',
    params: {
      departurePlace: toCity(o),
      destination: toCity(d),
      departureDate: dateStr,
      page: '1',
      size: '50',
    },
  });

  const toFlight = (r: {
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
  }): Flight => ({
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
  });

  const direct = (data.directFlights?.data ?? []).map((r) => toFlight(r));

  const interline = (data.interlineFlights ?? []).map((it) => {
    const segs = it.segments ?? [];
    const first = segs[0];
    const last = segs[segs.length - 1];
    const id = segs.map((s) => s.flightNo).filter(Boolean).join('+') || `interline-${Date.now()}`;
    const airline = first?.airlineCompany || '';
    const airlineCode = (first?.flightNo || '').replace(/[^A-Z]/g, '').slice(0, 2);

    return {
      id,
      airline,
      airlineCode,
      flightNumber: id,
      cabinType: first?.cabinType,
      origin: first?.departurePlace || toCity(o),
      destination: last?.destination || toCity(d),
      departureTime: first?.departureTime || '',
      arrivalTime: last?.arrivalTime || '',
      price: Number(it.totalPrice ?? 0),
      remainingSeats: undefined,
      duration: it.transferDuration || '',
      stops: Math.max(0, segs.length - 1),
      baggageWeight: 23,
      amenities: { hasPower: false, hasMeal: true, hasWifi: false, hasEntertainment: false },
      aircraft: undefined,
    } satisfies Flight;
  });

  return [...direct, ...interline];
}

