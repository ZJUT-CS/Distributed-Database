import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UserBookingsComponent from '../components/UserBookings';
import { useAuth } from '@/features/auth';
import { type ConfirmedBooking } from '@/features/booking';
import { searchOrders, type OrderSearchResult } from '@/features/booking/api/order';
import { ORDER_STATUS } from '@/features/admin/constants';

const pad2 = (n: number) => String(n).padStart(2, '0');

const parsePassengersJson = (raw?: string | null) => {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as any;
    if (!Array.isArray(parsed)) return undefined;
    const next = parsed
      .map((p) => ({
        name: String(p?.name ?? '').trim(),
        idCard: String(p?.idCard ?? p?.passportNumber ?? p?.id ?? '').trim(),
        type: (String(p?.type ?? '').toLowerCase() === 'child' || p?.type === 1 ? 'child' : 'adult') as 'child' | 'adult',
      }))
      .filter((p) => !!p.name || !!p.idCard);
    return next.length > 0 ? next : undefined;
  } catch {
    return undefined;
  }
};

const mapOrderToBooking = (o: OrderSearchResult): ConfirmedBooking => {
  const id = String(o.orderNo);
  const passengers = parsePassengersJson(o.passengersJson);

  const dbFlightId = o.flightId || '';

  return {
    id,
    flight: {
      id: dbFlightId,
      airline: '',
      airlineCode: (o.flightNo || '').replace(/[^A-Z]/g, '').slice(0, 2),
      flightNumber: o.flightNo || '',
      cabinType: 'economy',
      origin: o.origin || '',
      destination: o.destination || '',
      departureTime: o.departureTime || '',
      arrivalTime: o.arrivalTime || '',
      price: Number(o.totalAmount || 0),
      remainingSeats: 0,
      duration: '',
      stops: 0,
      baggageWeight: 23,
      amenities: { hasPower: false, hasMeal: true, hasWifi: false, hasEntertainment: false },
    },
    flights: [{
      id: dbFlightId,
      airline: '',
      airlineCode: (o.flightNo || '').replace(/[^A-Z]/g, '').slice(0, 2),
      flightNumber: o.flightNo || '',
      cabinType: 'economy',
      origin: o.origin || '',
      destination: o.destination || '',
      departureTime: o.departureTime || '',
      arrivalTime: o.arrivalTime || '',
      price: Number(o.totalAmount || 0),
      remainingSeats: 0,
      duration: '',
      stops: 0,
      baggageWeight: 23,
      amenities: { hasPower: false, hasMeal: true, hasWifi: false, hasEntertainment: false },
    }],
    status:
      o.orderStatus === ORDER_STATUS.PENDING_PAYMENT
        ? 'pending_payment'
        : o.orderStatus === ORDER_STATUS.CONFIRMED
          ? 'confirmed'
          : o.orderStatus === ORDER_STATUS.PROCESSING
            ? 'refunding'
            : o.orderStatus === ORDER_STATUS.REFUNDED
              ? 'refunded'
              : o.orderStatus === ORDER_STATUS.CANCELLED
                ? 'cancelled'
                : 'pending_payment',
    bookingDate: o.orderTime || new Date().toISOString(),
    totalPrice: Number(o.totalAmount || 0),
    passengerName: o.passengerName || passengers?.[0]?.name || '',
    passportNumber: '',
    passengers,
    contactEmail: o.contactEmail || '',
    phone: o.contactPhone || '',
  };
};

export const BookingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<ConfirmedBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    searchOrders({ userId: user.id, size: 1000 })
      .then((res) => setBookings(Array.isArray(res) ? res.map(mapOrderToBooking) : []))
      .catch((e: any) => setError(e?.message || '加载订单失败'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleUpdateBooking = (updated: ConfirmedBooking) => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    searchOrders({ userId: user.id, size: 1000 })
      .then((res) => setBookings(Array.isArray(res) ? res.map(mapOrderToBooking) : []))
      .catch((e: any) => setError(e?.message || '刷新订单失败'))
      .finally(() => setLoading(false));
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  return <UserBookingsComponent bookings={bookings} onBack={() => navigate('/')} onUpdateBooking={handleUpdateBooking} />;
};

export default BookingsPage;
