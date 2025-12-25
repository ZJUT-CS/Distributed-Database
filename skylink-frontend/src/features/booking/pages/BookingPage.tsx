import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookingForm, type BookingDetails, type ConfirmedBooking } from '@/features/booking';
import { type Flight } from '@/features/flight';
import { useAuth } from '@/features/auth';
import { createBooking } from '@/features/booking/api/booking';
import { saveOrderPassengers } from '@/utils/storage';
import { useToast } from '@/features/admin/components/Toast';

const BookingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
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
    const cabinId = flights[0]?.selectedCabinId;
    if (!cabinId) {
      toast.error('缺少舱位配置信息，请返回重新选择航班');
      return;
    }

    try {
      const passengers = Array.isArray(details.passengers) ? details.passengers.map(p => ({
        name: p.name || details.passengerName,
        idCard: p.idCard || details.passportNumber || '',
        phone: p.phone || details.phone || ''
      })) : [{
        name: details.passengerName,
        idCard: details.passportNumber || '',
        phone: details.phone || ''
      }];

      const created = await createBooking({
        userId: user.id as any,
        flightIds: flights.map(f => f.id),
        cabinId,
        passengers,
        isInterline: flights.length > 1,
        addons: details.addons
      });

      let id = String(created?.parentOrderId || '').trim();
      if (!id && created?.orderIds && created.orderIds.length > 0) {
        id = created.orderIds.join('+');
      }
      if (!id) {
        id = String(created?.orderIds?.[0] || '').trim();
      }

      if (!id) throw new Error('创建预订失败：缺少订单号');
      saveOrderPassengers(id, details.passengers);

      const totalPrice = Number.isFinite(Number(created?.totalAmount))
        ? Number(created?.totalAmount)
        : Number.isFinite(details.totalAmount || NaN)
          ? (details.totalAmount as number)
          : flights.reduce((sum, f) => sum + f.price, 0);

      const bookingDate = (created?.createTime as any) ? String(created.createTime) : new Date().toISOString();

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
      toast.error(e?.message || '预订失败');
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
