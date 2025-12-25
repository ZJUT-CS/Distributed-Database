export const API_CONFIG = {
  PAYMENT_TIMEOUT_MINUTES: 1,
  PAYMENT_TIMEOUT_MS: 1 * 60 * 1000,
  ORDER_STATUS: {
    PENDING: 1,
    PAID: 2,
    CHANGE_PROCESSING: 4,
    REFUNDED: 5,
    CANCELLED: 6,
  },
  PAYMENT_STATUS: {
    PENDING: 0,
    PAID: 1,
    FAILED: 2,
    REFUNDING: 3,
    REFUNDED: 4,
  },
  SEAT_STATUS: {
    AVAILABLE: 1,
    SOLD: 2,
    LOCKED: 3,
  },
  CABIN_CLASS: {
    ECONOMY: 'economy',
    BUSINESS: 'business',
    FIRST: 'first',
  },
} as const;

export type OrderStatus = typeof API_CONFIG.ORDER_STATUS[keyof typeof API_CONFIG.ORDER_STATUS];
export type PaymentStatus = typeof API_CONFIG.PAYMENT_STATUS[keyof typeof API_CONFIG.PAYMENT_STATUS];
export type SeatStatus = typeof API_CONFIG.SEAT_STATUS[keyof typeof API_CONFIG.SEAT_STATUS];
export type CabinClass = typeof API_CONFIG.CABIN_CLASS[keyof typeof API_CONFIG.CABIN_CLASS];
