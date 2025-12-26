import { request, type PageResult } from '@/shared/api/axios';

/**
 * 支付记录类型（与后端 PaymentSearchResponse 对齐）
 */
export interface PaymentItem {
  paymentId: string;
  orderNo: string;
  paymentAmount: number;
  paymentMethod: string;
  paymentStatus: number; // 0-待支付，1-已支付，2-支付失败，3-退款中，4-已退款
  tradeNo: string;
  paymentTime?: string;
  refundTime?: string;
}

export interface PaymentSearchParams {
  orderNo?: number;
  userId?: number;
  paymentStatus?: number;
  paymentMethod?: string;
  paymentTimeStart?: string;
  paymentTimeEnd?: string;
}

export interface PaymentSearchPageParams extends PaymentSearchParams {
  page: number;
  size: number;
}

/**
 * 查询支付记录列表
 */
export async function listPayments(params: PaymentSearchParams = {}): Promise<PaymentItem[]> {
  return request<PaymentItem[]>({
    method: 'GET',
    url: '/api/v1/payments',
    params: {
      orderNo: params.orderNo || undefined,
      userId: params.userId || undefined,
      paymentStatus: params.paymentStatus !== undefined ? params.paymentStatus : undefined,
      paymentMethod: params.paymentMethod || undefined,
      paymentTimeStart: params.paymentTimeStart || undefined,
      paymentTimeEnd: params.paymentTimeEnd || undefined,
    },
  });
}

/**
 * 查询支付记录分页（给管理端使用，不影响原有 listPayments 调用方）
 */
export async function listPaymentsPage(params: PaymentSearchPageParams): Promise<PageResult<PaymentItem>> {
  const res = await request<PageResult<PaymentItem>>({
    method: 'GET',
    url: '/api/v1/payments/page',
    params: {
      page: params.page,
      size: params.size,
      orderNo: params.orderNo || undefined,
      userId: params.userId || undefined,
      paymentStatus: params.paymentStatus !== undefined ? params.paymentStatus : undefined,
      paymentMethod: params.paymentMethod || undefined,
      paymentTimeStart: params.paymentTimeStart || undefined,
      paymentTimeEnd: params.paymentTimeEnd || undefined,
    },
  });
  return res ?? { total: 0, data: [] };
}

/**
 * 创建支付（模拟支付）
 */
export interface CreatePaymentRequest {
  orderId: string;
  paymentMethod: string;
}

export async function createPayment(req: CreatePaymentRequest): Promise<PaymentItem> {
  return request<PaymentItem>({ method: 'POST', url: '/api/v1/payments', data: req });
}

/**
 * 确认支付
 */
export interface ConfirmPaymentRequest {
  token: string;
  paymentMethod: string;
}

export async function confirmPayment(req: ConfirmPaymentRequest): Promise<PaymentItem> {
  return request<PaymentItem>({ method: 'POST', url: '/api/v1/payments/confirmations', data: req });
}
