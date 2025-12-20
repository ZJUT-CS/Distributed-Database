import { request } from '../../../lib/axios';

export interface PaymentConfirmToken {
  orderNo: string;
  amount: number;
  timestamp: number;
  token: string;
  expiresAt: number;
}

export async function payOrder(body: { orderNo: string | number; amount: number; method: string }): Promise<void> {
  const orderNo = String(body.orderNo ?? '').trim();
  if (!orderNo) throw new Error('缺少 orderNo');
  if (!Number.isFinite(body.amount) || body.amount <= 0) throw new Error('amount 无效');
  const method = String(body.method ?? '').trim();
  if (!method) throw new Error('缺少 method');

  await request({
    method: 'POST',
    url: '/api/v1/payments/pay',
    data: {
      orderNo: orderNo,
      amount: body.amount,
      method,
    },
  });
}

export async function createPaymentConfirmToken(body: {
  orderNo: string | number;
  amount: number;
}): Promise<PaymentConfirmToken> {
  const orderNo = String(body.orderNo ?? '').trim();
  if (!orderNo) throw new Error('缺少 orderNo');
  if (!Number.isFinite(body.amount) || body.amount <= 0) throw new Error('amount 无效');

  return request<PaymentConfirmToken>({
    method: 'POST',
    url: '/api/v1/payments/confirm-token',
    data: {
      orderNo: orderNo,
      amount: body.amount,
    },
  });
}

export async function confirmPayment(body: {
  orderNo: string | number;
  amount: number;
  timestamp: number;
  token: string;
  method: string;
}): Promise<void> {
  const orderNo = String(body.orderNo ?? '').trim();
  if (!orderNo) throw new Error('缺少 orderNo');
  if (!Number.isFinite(body.amount) || body.amount <= 0) throw new Error('amount 无效');
  const token = String(body.token ?? '').trim();
  if (!token) throw new Error('缺少 token');
  const method = String(body.method ?? '').trim();
  if (!method) throw new Error('缺少 method');
  if (!Number.isFinite(body.timestamp)) throw new Error('timestamp 无效');

  await request({
    method: 'POST',
    url: '/api/v1/payments/confirm',
    data: {
      orderNo: orderNo,
      amount: body.amount,
      timestamp: body.timestamp,
      token,
      method,
    },
  });
}

