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
        aircraftModel?: string;
        baggageAllowance?: string;
        services?: string;
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
        aircraftModel?: string;
        baggageAllowance?: string;
        services?: string;
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

  // ✅ 解析行李重量 (如 "23kg" -> 23)
  const parseBaggageWeight = (allowance?: string): number => {
    if (!allowance) return 23; // 默认值
    const match = allowance.match(/(\d+)/);
    return match ? parseInt(match[1]) : 23;
  };

  // ✅ 解析服务项目
  const parseAmenities = (services?: string) => {
    const s = (services || '').toLowerCase();
    return {
      hasPower: s.includes('电源') || s.includes('power') || s.includes('usb'),
      hasMeal: s.includes('餐') || s.includes('meal') || s.includes('食'),
      hasWifi: s.includes('wifi') || s.includes('无线'),
      hasEntertainment: s.includes('娱乐') || s.includes('entertainment') || s.includes('影音'),
    };
  };

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
    aircraftModel?: string;
    baggageAllowance?: string;
    services?: string;
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
    baggageWeight: parseBaggageWeight(r.baggageAllowance),
    amenities: parseAmenities(r.services),
    aircraft: r.aircraftModel,
    baggageAllowance: r.baggageAllowance,
    services: r.services,
  });

  const direct = (data.directFlights?.data ?? []).map((r) => toFlight(r));

  const interline = (data.interlineFlights ?? []).map((it) => {
    const segs = it.segments ?? [];
    const first = segs[0];
    const last = segs[segs.length - 1];
    const id = segs.map((s) => s.flightNo).filter(Boolean).join('+') || `interline-${Date.now()}`;
    const airline = first?.airlineCompany || '';
    const airlineCode = (first?.flightNo || '').replace(/[^A-Z]/g, '').slice(0, 2);

    // 将后端 segments 转换为 FlightSegment 格式
    const flightSegments = segs.map((s) => ({
      flightNumber: s.flightNo,
      origin: s.departurePlace,
      destination: s.destination,
      departureTime: s.departureTime,
      arrivalTime: s.arrivalTime,
      duration: s.duration,
      airline: s.airlineCompany,
      airlineCode: (s.flightNo || '').replace(/[^A-Z]/g, '').slice(0, 2),
    }));

    // 计算最小剩余座位数（短板效应）
    const minSeats = segs.reduce((min, s) => {
      const seats = typeof s.remainingSeats === 'number' ? s.remainingSeats : Infinity;
      return Math.min(min, seats);
    }, Infinity);

    // 从第一个 segment 获取行李和服务信息
    const firstBaggageAllowance = first?.baggageAllowance;
    const firstServices = first?.services;

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
      remainingSeats: minSeats === Infinity ? undefined : minSeats,
      duration: it.transferDuration || '',
      stops: Math.max(0, segs.length - 1),
      baggageWeight: parseBaggageWeight(firstBaggageAllowance),
      amenities: parseAmenities(firstServices),
      aircraft: first?.aircraftModel,
      baggageAllowance: firstBaggageAllowance,
      services: firstServices,
      // ✅ 联程专用字段
      isInterline: true,
      transferCity: it.transferCity,
      transferDuration: it.transferDuration ? parseTransferDuration(it.transferDuration) : undefined,
      segments: flightSegments,
    } satisfies Flight;
  });

  return [...direct, ...interline];
}

// 解析中转时长字符串为分钟数
function parseTransferDuration(durationStr: string): number | undefined {
  // 格式如 "3h 30m"
  const match = durationStr.match(/(\d+)h\s*(\d+)m/);
  if (match) {
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }
  return undefined;
}

