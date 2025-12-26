export interface Payment {
  id: number;
  orderId: number;
  userId: number;
  amount: number;
  status: number;
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}
