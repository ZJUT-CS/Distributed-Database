import { request } from '@/shared/api/axios';
import { POPULAR_AIRPORTS as AIRPORTS_CONST } from '@/config/data/airports';
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
  cabinClass?: string;
}): Promise<Flight[]> {
  const o = (params.origin || '').trim();
  const d = (params.destination || '').trim();
  const dateStr = (params.departureDate || '').trim();
  if (!o || !d || !dateStr) throw new Error('查询参数不完整');

  // Map cabinClass to backend cabinType code
  const cabinMap: Record<string, string> = {
    'economy': 'Y',
    'business': 'J',
    'first': 'F'
  };
  
  let cabinType: string | undefined = undefined;
  if (params.cabinClass) {
    const key = params.cabinClass.toLowerCase();
    cabinType = cabinMap[key] || 'Y';
  }

  const data = await request<{
    directFlights?: {
      total: number;
      data: Array<{
        flightId?: number | string;
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
        flightId?: number | string;
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
      cabinType: cabinType, // Pass mapped cabin type
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

  // ✅ 解析服务项目（更健壮，按分隔符拆分逐项匹配）
  const parseAmenities = (services?: string) => {
    const raw = (services || '').toLowerCase();
    const tokens = raw
      .split(/[，,;；、\/\|\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const includesAny = (t: string, kws: string[]) => kws.some((k) => t.includes(k));
    const hasPower =
      tokens.length > 0
        ? tokens.some((t) => includesAny(t, ['电源', 'power', 'usb', '插座']))
        : raw.includes('电源') || raw.includes('power') || raw.includes('usb') || raw.includes('插座');
    const hasMeal =
      tokens.length > 0
        ? tokens.some((t) => includesAny(t, ['餐', 'meal', '餐饮', '食']))
        : raw.includes('餐') || raw.includes('meal') || raw.includes('餐饮') || raw.includes('食');
    const hasWifi =
      tokens.length > 0
        ? tokens.some((t) => includesAny(t, ['wifi', '无线', 'wi-fi']))
        : raw.includes('wifi') || raw.includes('无线') || raw.includes('wi-fi');
    const hasEntertainment =
      tokens.length > 0
        ? tokens.some((t) => includesAny(t, ['娱乐', 'entertainment', '影音']))
        : raw.includes('娱乐') || raw.includes('entertainment') || raw.includes('影音');
    return { hasPower, hasMeal, hasWifi, hasEntertainment };
  };

  // 统一计算并规范化时长，避免负值显示
  const computeDuration = (dep?: string, arr?: string): string => {
    if (!dep || !arr) return '';
    const depDate = new Date(dep);
    const arrDate = new Date(arr);
    if (Number.isNaN(depDate.getTime()) || Number.isNaN(arrDate.getTime())) return '';
    let diffMin = Math.round((arrDate.getTime() - depDate.getTime()) / 60000);
    if (!Number.isFinite(diffMin)) return '';
    if (diffMin < 0) diffMin = Math.abs(diffMin);
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return `${h}h ${m}m`;
  };

  const toFlight = (r: {
    flightId?: number | string;  // ✅ 添加后端返回的数据库ID字段
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
    id: String(r.flightId ?? '').trim(),
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
    duration: computeDuration(r.departureTime, r.arrivalTime) || r.duration || '',
    stops: 0,
    baggageWeight: parseBaggageWeight(r.baggageAllowance),
    amenities: parseAmenities(r.services),
    aircraft: r.aircraftModel,
    baggageAllowance: r.baggageAllowance,
    services: r.services,
  });

  const direct = (data.directFlights?.data ?? []).map((r) => toFlight(r)).filter((f) => !!f.id);

  const interline = (data.interlineFlights ?? [])
    .map((it): Flight | null => {
    const segs = it.segments ?? [];
    const first = segs[0];
    const last = segs[segs.length - 1];

    if (!segs.length) return null;
    const flightIds = segs.map((s) => String(s.flightId ?? '').trim()).filter(Boolean);
    if (flightIds.length !== segs.length) return null;
    const id = flightIds.join('+');
    const airline = first?.airlineCompany || '';
    const airlineCode = (first?.flightNo || '').replace(/[^A-Z]/g, '').slice(0, 2);

    // 将后端 segments 转换为 FlightSegment 格式
    const flightSegments = segs.map((s) => ({
      flightId: String(s.flightId ?? '').trim(),
      flightNumber: s.flightNo,
      origin: s.departurePlace,
      destination: s.destination,
      departureTime: s.departureTime,
      arrivalTime: s.arrivalTime,
      duration: computeDuration(s.departureTime, s.arrivalTime) || s.duration,
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

    const flightObj: Flight = {
      id,
      airline,
      airlineCode,
      flightNumber: segs.map((s) => s.flightNo).filter(Boolean).join('+') || 'INTERLINE',
      cabinType: first?.cabinType,
      origin: first?.departurePlace || toCity(o),
      destination: last?.destination || toCity(d),
      departureTime: first?.departureTime || '',
      arrivalTime: last?.arrivalTime || '',
      price: Number(it.totalPrice ?? 0),
      remainingSeats: minSeats === Infinity ? undefined : minSeats,
      duration: computeDuration(first?.departureTime, last?.arrivalTime) || it.transferDuration || '',
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
    };
    return flightObj;
  })
    .filter(Boolean) as Flight[];

  // 🔧 去重：避免后端返回重复数据导致前端显示多个相同航班
  const allFlights = [...direct, ...interline];
  const uniqueFlights = Array.from(
    new Map(allFlights.map(flight => [flight.id, flight])).values()
  );

  return uniqueFlights;
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

