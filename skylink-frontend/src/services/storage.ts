import { ConfirmedBooking, RefundChangeRecord } from '../types';

const STORAGE_KEYS = {
  BOOKINGS: 'skylink_user_bookings',
  REFUNDS: 'skylink_refund_change_records',
};

// Bookings
export const loadStoredBookings = (): ConfirmedBooking[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as ConfirmedBooking[];
  } catch {
    return [];
  }
};

export const saveStoredBookings = (items: ConfirmedBooking[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(items));
  } catch {
    // ignore
  }
};

// Refunds & Changes
export const loadStoredRefunds = (): RefundChangeRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REFUNDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as RefundChangeRecord[];
  } catch {
    return [];
  }
};

export const saveStoredRefunds = (items: RefundChangeRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.REFUNDS, JSON.stringify(items));
  } catch {
    // ignore
  }
};

export const addRefundRecord = (record: RefundChangeRecord) => {
  const current = loadStoredRefunds();
  const next = [record, ...current];
  saveStoredRefunds(next);
  return next;
};

export const updateRefundRecord = (id: string, updates: Partial<RefundChangeRecord>) => {
  const current = loadStoredRefunds();
  const index = current.findIndex(r => r.id === id);
  if (index === -1) return current;
  
  const next = [...current];
  next[index] = { ...next[index], ...updates };
  saveStoredRefunds(next);
  return next;
};

export const deleteRefundRecord = (id: string) => {
  const current = loadStoredRefunds();
  const next = current.filter(r => r.id !== id);
  saveStoredRefunds(next);
  return next;
};
