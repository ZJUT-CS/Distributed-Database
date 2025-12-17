import { request } from './api';

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
      orderNo: Number(orderNo),
      amount: body.amount,
      method,
    },
  });
}
