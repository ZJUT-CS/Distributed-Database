import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookingForm from '../../components/booking/BookingForm';
import { Flight, BookingDetails, ConfirmedBooking } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { createOrder } from '../../services/orders';

const BookingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const flights = (location.state?.flights as Flight[]) || [];
  const passengerCount = (() => {
    const raw = Number(location.state?.passengers ?? 1);
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
  })();
  const cabinClass = (() => {
    const raw = location.state?.cabinClass;
    return raw === 'economy' || raw === 'business' || raw === 'first' ? raw : 'economy';
  })();

  if (!user || user.id == null || String(user.id).trim() === '') {
    navigate('/login', { state: { from: location.pathname, bookingState: location.state } });
    return null;
  }

  if (flights.length === 0) {
      navigate('/');
      return null;
  }

  const handleConfirm = async (details: BookingDetails) => {
    const flightNo = String(flights[0]?.flightNumber || flights[0]?.id || '').trim();
    if (!flightNo) {
      alert('缺少航班号，无法下单');
      return;
    }

    const cabinType =
      String(flights[0]?.cabinType || '').trim() ||
      (cabinClass === 'first' ? 'F' : cabinClass === 'business' ? 'J' : 'Y');

    try {
      const created = await createOrder({
        userId: user.id as any,
        flightNo,
        cabinType,
        ticketNum: passengerCount,
      });

      const id = String(created?.orderNo ?? '').trim();
      if (!id) throw new Error('创建订单失败：缺少订单号');

      const totalPrice = Number.isFinite(Number(created?.totalAmount))
        ? Number(created?.totalAmount)
        : Number.isFinite(details.totalAmount || NaN)
          ? (details.totalAmount as number)
          : flights.reduce((sum, f) => sum + f.price, 0);

      const bookingDate = (created?.orderTime as any) ? String(created.orderTime) : new Date().toISOString();

      const newBooking: ConfirmedBooking = {
        ...details,
        id,
        flight: flights[0],
        flights,
        status: 'pending_payment',
        bookingDate,
        totalPrice,
        passengerName: details.passengerName,
        passportNumber: details.passportNumber,
        contactEmail: details.contactEmail,
        phone: details.phone,
      };

      navigate(`/my-bookings/${encodeURIComponent(id)}`, { state: { booking: newBooking } });
    } catch (e: any) {
      alert(e?.message || '下单失败');
    }
  };

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-8">
        <BookingForm 
            flights={flights} 
            passengerCount={passengerCount}
            cabinClass={cabinClass}
            onConfirm={handleConfirm} 
            onCancel={() => navigate(-1)} 
        />
    </div>
  );
};

export default BookingPage;
