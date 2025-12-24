import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookingForm, type BookingDetails, type ConfirmedBooking } from '@/features/booking';
import { type Flight } from '@/features/flight';
import { useAuth } from '@/features/auth';
import { createOrder } from '@/features/booking/api/order';
import { createBooking } from '@/features/booking/api/booking';
import { saveOrderPassengers } from '@/utils/storage';

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
    const isInterline = flights.length > 1;

    try {
      let orderId: string;
      let totalPrice: number;
      let bookingDate: string;

      if (isInterline) {
        // 联程/多程下单
        const passengers = Array.isArray(details.passengers)
          ? details.passengers.map(p => ({
            name: p.name || '',
            idCard: p.idCard || '',
            phone: details.phone || '',
          }))
          : [{ name: details.passengerName, idCard: details.passportNumber || '', phone: details.phone || '' }];

        // 提取所有航班的ID（使用 flightNumber 或 id）
        const flightIds = flights.map(f => f.flightNumber || f.id || '').filter(Boolean);

        if (flightIds.length === 0) {
          throw new Error('缺少航班号，无法下单');
        }

        const response = await createBooking({
          userId: user.id as any,
          flightIds,
          passengers,
          isInterline: true,
        });

        // 使用父订单ID或第一个子订单ID
        orderId = response.parentOrderId || response.orderIds[0] || '';
        totalPrice = response.totalAmount ?? flights.reduce((sum, f) => sum + f.price, 0);
        bookingDate = response.createTime || new Date().toISOString();

        if (!orderId) throw new Error('创建联程订单失败：缺少订单号');
      } else {
        // 单程下单
        const flightNo = String(flights[0]?.flightNumber || flights[0]?.id || '').trim();
        if (!flightNo) {
          throw new Error('缺少航班号，无法下单');
        }

        const cabinType =
          String(flights[0]?.cabinType || '').trim() ||
          (cabinClass === 'first' ? 'F' : cabinClass === 'business' ? 'J' : 'Y');

        const passengersJson = JSON.stringify(Array.isArray(details.passengers) ? details.passengers : []);
        const created = await createOrder({
          userId: user.id as any,
          flightNo,
          cabinType,
          ticketNum: passengerCount,
          passengerName: details.passengerName,
          contactEmail: details.contactEmail,
          contactPhone: details.phone,
          passengersJson,
        });

        orderId = String(created?.orderNo ?? '').trim();
        if (!orderId) throw new Error('创建订单失败：缺少订单号');

        totalPrice = Number.isFinite(Number(created?.totalAmount))
          ? Number(created?.totalAmount)
          : Number.isFinite(details.totalAmount || NaN)
            ? (details.totalAmount as number)
            : flights.reduce((sum, f) => sum + f.price, 0);

        bookingDate = (created?.orderTime as any) ? String(created.orderTime) : new Date().toISOString();
      }

      saveOrderPassengers(orderId, details.passengers);

      const newBooking: ConfirmedBooking = {
        ...details,
        id: orderId,
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

      navigate(`/my-bookings/${encodeURIComponent(orderId)}`, { state: { booking: newBooking } });
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
