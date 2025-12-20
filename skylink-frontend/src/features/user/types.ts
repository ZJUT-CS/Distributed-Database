export type AuditStatus = 'pending' | 'approved' | 'rejected';

export interface RefundChangeRecord {
  id: string;
  orderId: string;
  passenger: string;
  type: '退票' | '改签';
  oldFlight: string;
  newFlight: string;
  applyTime: string;
  status: AuditStatus;
  remark?: string;
}

