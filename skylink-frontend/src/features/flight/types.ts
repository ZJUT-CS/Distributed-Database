export type FlightStatus = 'active' | 'delayed' | 'cancelled' | 'full';

export interface FlightSegment {
  flightNumber: string;
  airline: string;
  airlineCode: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
}

export interface Flight {
  id: string;
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
  baggageWeight: number;
  amenities: {
    hasPower: boolean;
    hasMeal: boolean;
    hasWifi: boolean;
    hasEntertainment: boolean;
  };
  aircraft?: string;
  /** 联程航班分段信息 */
  segments?: FlightSegment[];
  /** 中转城市 */
  transferCity?: string;
  /** 中转时长（分钟） */
  transferDuration?: number;
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

