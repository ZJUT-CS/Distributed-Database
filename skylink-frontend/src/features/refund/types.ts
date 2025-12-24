export interface RefundChange {
  id: number;
  orderId: number;
  userId: number;
  operType: number;
  status: number;
  reason?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}
