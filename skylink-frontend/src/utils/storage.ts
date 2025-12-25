import { type ConfirmedBooking, type PassengerInfo } from '@/features/booking';
import { type RefundChangeRecord } from '@/features/refund/types';

const STORAGE_KEYS = {
  BOOKINGS: 'skylink_user_bookings',
  REFUNDS: 'skylink_refund_change_records',
  ORDER_PASSENGERS_PREFIX: 'skylink_order_passengers_',
};

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
  }
};

const normalizePassengerList = (raw: unknown): PassengerInfo[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const list = raw
    .map((p) => {
      const obj = p as any;
      const name = String(obj?.name ?? '').trim();
      const idCard = String(obj?.idCard ?? obj?.passportNumber ?? '').trim();
      const type = obj?.type === 'child' ? 'child' : 'adult';
      return { name, idCard, type } as PassengerInfo;
    })
    .filter((p) => !!p.name || !!p.idCard);
  return list.length > 0 ? list : undefined;
};

export const saveOrderPassengers = (orderId: string | number, passengers?: PassengerInfo[]) => {
  const id = String(orderId ?? '').trim();
  if (!id) return;
  try {
    const sanitized = normalizePassengerList(passengers);
    const key = `${STORAGE_KEYS.ORDER_PASSENGERS_PREFIX}${id}`;
    if (!sanitized) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(sanitized));
  } catch {
  }
};

export const loadOrderPassengers = (orderId: string | number): PassengerInfo[] | undefined => {
  const id = String(orderId ?? '').trim();
  if (!id) return undefined;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.ORDER_PASSENGERS_PREFIX}${id}`);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as unknown;
    return normalizePassengerList(parsed);
  } catch {
    return undefined;
  }
};

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
  const index = current.findIndex((r) => r.id === id);
  if (index === -1) return current;

  const next = [...current];
  next[index] = { ...next[index], ...updates };
  saveStoredRefunds(next);
  return next;
};

export const deleteRefundRecord = (id: string) => {
  const current = loadStoredRefunds();
  const next = current.filter((r) => r.id !== id);
  saveStoredRefunds(next);
  return next;
};

