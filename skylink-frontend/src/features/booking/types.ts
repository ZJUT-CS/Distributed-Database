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

