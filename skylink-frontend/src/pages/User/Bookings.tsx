import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserBookings from '../../components/user/UserBookings';
import { useAuth } from '../../hooks/useAuth';
import { ConfirmedBooking } from '../../types';
import { generateMockFlights } from '../../services/mockData';

const BookingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<ConfirmedBooking[]>([]);

  useEffect(() => {
     if (user) {
        // Generate some mock bookings
        const flights = generateMockFlights('PEK', 'SHA', new Date().toISOString().split('T')[0]);
        if (flights.length > 0) {
            setBookings([
                {
                    id: 'ORD-DEMO-001',
                    passengerName: user.username,
                    passportNumber: '******',
                    contactEmail: 'user@skylink.com',
                    phone: '138****0000',
                    flight: flights[0],
                    flights: [flights[0]],
                    status: 'confirmed',
                    bookingDate: new Date().toISOString(),
                    totalPrice: flights[0].price
                }
            ]);
        }
     }
  }, [user]);

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <UserBookings bookings={bookings} onBack={() => navigate('/')} />
  );
};

export default BookingsPage;
