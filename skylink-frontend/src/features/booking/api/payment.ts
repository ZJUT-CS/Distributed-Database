import { request } from '../../../lib/axios';

export interface PaymentConfirmToken {
  orderNo: string;
  amount: number;
  timestamp: number;
  token: string;
  expiresAt: number;
}

function normalizeAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount 无效');
  // BigDecimal 端接收 string 更稳，避免 JS 浮点误差导致后端 amount mismatch
  return amount.toFixed(2);
}

export async function payOrder(body: { orderNo: string | number; amount: number; method: string }): Promise<void> {
  const orderNo = String(body.orderNo ?? '').trim();
  if (!orderNo) throw new Error('缺少 orderNo');
  const amount = normalizeAmount(body.amount);
  const method = String(body.method ?? '').trim();
  if (!method) throw new Error('缺少 method');

  await request({
    method: 'POST',
    url: '/api/v1/payments',
    data: {
      orderNo: orderNo,
      amount,
      method,
    },
  });
}

export async function createPaymentConfirmToken(body: {
  orderNo: string | number;
  amount: number;
}): Promise<PaymentConfirmToken> {
  const orderNoStr = String(body.orderNo ?? '').trim();
  if (!orderNoStr) throw new Error('缺少 orderNo');

  // 移除 BigInt 转换，直接传递字符串以支持 "ID1+ID2" 格式
  const amount = normalizeAmount(body.amount);

  return request<PaymentConfirmToken>({
    method: 'POST',
    url: '/api/v1/payments/confirmation-tokens',
    data: {
      orderNo: orderNoStr,
      amount,
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
  const orderNoStr = String(body.orderNo ?? '').trim();
  if (!orderNoStr) throw new Error('缺少 orderNo');
  // 移除 BigInt 转换，支持 "ID1+ID2"
  const amount = normalizeAmount(body.amount);
  const token = String(body.token ?? '').trim();
  if (!token) throw new Error('缺少 token');
  const method = String(body.method ?? '').trim();
  if (!method) throw new Error('缺少 method');
  if (!Number.isFinite(body.timestamp)) throw new Error('timestamp 无效');

  await request({
    method: 'POST',
    url: '/api/v1/payments/confirmations',
    data: {
      orderNo: orderNoStr,
      amount,
      timestamp: body.timestamp,
      token,
      method,
    },
  });
}

