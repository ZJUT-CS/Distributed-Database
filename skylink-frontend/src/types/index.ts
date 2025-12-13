
export interface Flight {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string; // ISO String
  arrivalTime: string; // ISO String
  price: number;
  duration: string;
  stops: number;
  baggageWeight: number; // Added: Baggage allowance in kg
  amenities: {           // Added: Onboard amenities
    hasPower: boolean;
    hasMeal: boolean;
    hasWifi: boolean;
    hasEntertainment: boolean;
  };
  aircraft?: string;
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
  segments: TripSegment[]; // Standardized segments list
  passengers: number;
  passengerDetails?: {
    adults: number;
    children: number;
    infants: number;
  };
  cabinClass?: 'economy' | 'business' | 'first';
}

export interface BookingDetails {
  passengerName: string;
  passportNumber: string;
  contactEmail: string;
  phone: string; // Added phone number
}

export interface ConfirmedBooking extends BookingDetails {
  id: string;
  flight: Flight; // For backward compatibility, maybe primarily used for display
  flights?: Flight[]; // Support multiple flights
  status: 'confirmed' | 'cancelled';
  bookingDate: string;
  totalPrice?: number;
}

export interface AIRecommendation {
  city: string;
  airportCode: string;
  reason: string;
}

export interface User {
  username: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
}

export type FlightStatus = 'active' | 'delayed' | 'cancelled' | 'full';

export interface MapPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  value: number; // 影响大小
  type: 'hub' | 'normal' | 'origin' | 'destination'; // 影响颜色
  info?: string;
}

export interface FilterState {
  stops: 'all' | 'direct' | '1stop';
  airlines: string[]; // List of airline codes
  priceMax: number;
  departureTime: string[]; // ['morning', 'afternoon', 'evening', 'night']
  arrivalTime: string[];
  originAirports: string[]; // List of origin airport codes
  destinationAirports: string[]; // List of destination airport codes
  durationMax: number; // in minutes
}
