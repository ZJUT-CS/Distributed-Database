import type { Flight } from '../flight/types';

export interface PassengerInfo {
  name: string;
  idCard: string;
  type?: 'adult' | 'child';
}

export interface BookingDetails {
  passengerName: string;
  passportNumber: string;
  passengers?: PassengerInfo[];
  contactEmail: string;
  phone: string;
  cabinClass?: 'economy' | 'business' | 'first';
  addons?: {
    insurance: boolean;
    fastTicket: boolean;
  };
  totalAmount?: number;
}

export interface ConfirmedBooking extends BookingDetails {
  id: string;
  flight: Flight;
  flights?: Flight[];
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'refunding' | 'refunded' | 'changed';
  bookingDate: string;
  totalPrice?: number;
}

export interface Order {
  orderNo: string | number;
  userId?: string | number;
  orderStatus?: number;
  ticketNum?: number;
  totalAmount?: number;
  orderTime?: string;
  payTime?: string;
  refundTime?: string;
  changeTime?: string;
  flightNo?: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
  arrivalTime?: string;
  passengerName?: string;
  email?: string;
  phoneNumber?: string;
}

