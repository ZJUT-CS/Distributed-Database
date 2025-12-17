import { request } from './api';
import type { ConfirmedBooking } from '../types';

export async function listBookings(userId: string | number): Promise<ConfirmedBooking[]> {
  const uid = String(userId ?? '').trim();
  if (!uid) throw new Error('缺少 userId');

  return request<ConfirmedBooking[]>({
    method: 'GET',
    url: '/api/v1/bookings',
    params: { userId: uid },
  });
}
