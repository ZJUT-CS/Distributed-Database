import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookingForm from '../../components/booking/BookingForm';
import { Flight, BookingDetails, ConfirmedBooking } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { loadStoredBookings, saveStoredBookings } from '../../services/storage';

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

  if (!user) {
     navigate('/login');
     return null;
  }

  if (flights.length === 0) {
      navigate('/');
      return null;
  }

  const handleConfirm = (details: BookingDetails) => {
     // Mock booking creation
     const totalPrice = Number.isFinite(details.totalAmount || NaN)
       ? (details.totalAmount as number)
       : flights.reduce((sum, f) => sum + f.price, 0);
     const newBooking: ConfirmedBooking = {
        ...details,
        id: `ORD-${Math.floor(Math.random() * 1000000)}`,
        flight: flights[0],
        flights: flights,
        status: 'confirmed',
        bookingDate: new Date().toISOString(),
        totalPrice: totalPrice,
        passengerName: details.passengerName,
        passportNumber: details.passportNumber,
        contactEmail: details.contactEmail,
        phone: details.phone
     };

     const stored = loadStoredBookings();
     const next = [newBooking, ...stored.filter((b) => b.id !== newBooking.id)];
     saveStoredBookings(next);
     
     // Navigate to confirmation with booking data
     navigate('/booking/confirmation', { state: { booking: newBooking } });
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
