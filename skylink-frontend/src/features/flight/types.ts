export type FlightStatus = 'active' | 'delayed' | 'cancelled' | 'full';

/**
 * 联程航班航段信息
 */
export interface FlightSegment {
  flightNumber: string;
  airline?: string;
  airlineCode?: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration?: string;
}

export interface Flight {
  id: number;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  cabinType?: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  remainingSeats?: number;
  duration: string;
  stops: number;
  /** 托运行李额度 (kg) */
  baggageWeight: number;
  /** 机上服务/设施 */
  amenities: {
    hasPower: boolean;
    hasMeal: boolean;
    hasWifi: boolean;
    hasEntertainment: boolean;
  };
  aircraft?: string;

  /** 原始行李数据 (后端返回，如 "23kg") */
  baggageAllowance?: string;
  /** 原始服务数据 (后端返回，如 "餐食,WiFi") */
  services?: string;

  /** 用户选择的舱位配置ID (用于预订流程) */
  selectedCabinId?: number;

  // 联程航班专用字段
  /** 联程航段详情 */
  segments?: FlightSegment[];
  /** 中转城市 */
  transferCity?: string;
  /** 中转时长（分钟） */
  transferDuration?: number;
  /** 是否为联程航班 */
  isInterline?: boolean;
}

export interface Airport {
  code: string;
  city: string;
  name: string;
  lat: number;
  lng: number;
}

export interface TripSegment {
  origin: string;
  destination: string;
  date: string;
}

export interface SearchParams {
  tripType: 'oneWay' | 'roundTrip' | 'multiCity';
  segments: TripSegment[];
  passengers: number;
  passengerDetails?: {
    adults: number;
    children: number;
    infants: number;
  };
  cabinClass?: 'economy' | 'business' | 'first';
}

export interface MapPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  value: number;
  type: 'hub' | 'normal' | 'origin' | 'destination';
  info?: string;
}

export interface FilterState {
  stops: 'all' | 'direct' | '1stop';
  airlines: string[];
  priceMax: number;
  departureTime: string[];
  arrivalTime: string[];
  originAirports: string[];
  destinationAirports: string[];
  durationMax: number;
}


