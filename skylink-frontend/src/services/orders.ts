import { request } from './api';

export async function cancelOrder(orderId: string | number): Promise<void> {
  const id = String(orderId ?? '').trim();
  if (!id) throw new Error('缺少 orderId');

  await request({
    method: 'POST',
    url: `/api/v1/orders/${encodeURIComponent(id)}/cancel`,
  });
}
