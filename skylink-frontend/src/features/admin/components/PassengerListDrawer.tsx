import React from 'react';
import { Users } from 'lucide-react';
import AdminDrawer from './AdminDrawer';
import AdminBadge from './AdminBadge';
import { listAdminOrders, type AdminOrderItem } from '../api/orders';

export interface PassengerDrawerProps {
  open: boolean;
  onClose: () => void;
  flightNo: string;
  flightId?: string;
}

export interface PassengerInfo {
  id: string;
  orderNo: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  seatCount: number;
  totalAmount: number;
  status: number;
  orderTime: string;
}

const STATUS_MAP: Record<number, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  0: { label: '待支付', variant: 'warning' },
  1: { label: '已支付', variant: 'success' },
  2: { label: '已取消', variant: 'danger' },
  3: { label: '已退票', variant: 'danger' },
  4: { label: '已完成', variant: 'info' },
};

const toPassengerInfo = (order: AdminOrderItem): PassengerInfo => ({
  id: String(order.orderNo ?? ''),
  orderNo: String(order.orderNo ?? ''),
  name: String(order.passengerName ?? '-').trim(),
  phone: order.phoneNumber ?? null,
  email: order.email ?? null,
  seatCount: order.ticketNum ?? 1,
  totalAmount: order.totalAmount ?? 0,
  status: order.orderStatus ?? 0,
  orderTime: String(order.orderTime ?? ''),
});

const PassengerListDrawer: React.FC<PassengerDrawerProps> = ({ open, onClose, flightNo, flightId }) => {
  const [passengers, setPassengers] = React.useState<PassengerInfo[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && flightNo) {
      setLoading(true);
      listAdminOrders({ page: 1, size: 1000, flightNo })
        .then((res) => {
          const data = (res.data ?? []).map(toPassengerInfo);
          setPassengers(data);
        })
        .catch((err) => {
          console.error('加载乘客列表失败', err);
          setPassengers([]);
        })
        .finally(() => setLoading(false));
    }
  }, [open, flightNo]);

  const totalSeats = passengers.reduce((sum, p) => sum + p.seatCount, 0);
  const totalAmount = passengers.reduce((sum, p) => sum + p.totalAmount, 0);

  const subtitle = `航班号: ${flightNo}${flightId ? ` | ID: ${flightId}` : ''}`;

  return (
    <AdminDrawer open={open} onClose={onClose} title="乘客列表" subtitle={subtitle} size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mr-3"></div>
          <span className="text-sm">加载中...</span>
        </div>
      ) : passengers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Users className="w-12 h-12 mb-3 text-gray-300" />
          <span className="text-sm">暂无乘客</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{passengers.length}</div>
              <div className="text-xs text-gray-500">订单数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{totalSeats}</div>
              <div className="text-xs text-gray-500">总座位数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">¥{totalAmount.toLocaleString()}</div>
              <div className="text-xs text-gray-500">总金额</div>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {passengers.map((passenger) => {
              const statusInfo = STATUS_MAP[passenger.status] ?? { label: '未知', variant: 'info' };
              return (
                <div key={passenger.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {passenger.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{passenger.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{passenger.orderNo}</div>
                      </div>
                    </div>
                    <AdminBadge size="sm" variant={statusInfo.variant}>
                      {statusInfo.label}
                    </AdminBadge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    {passenger.phone && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">电话:</span>
                        <span className="font-medium">{passenger.phone}</span>
                      </div>
                    )}
                    {passenger.email && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">邮箱:</span>
                        <span className="font-medium truncate max-w-[120px]">{passenger.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">座位:</span>
                      <span className="font-medium">{passenger.seatCount} 张</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">金额:</span>
                      <span className="font-medium text-indigo-600">¥{passenger.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    预订时间: {passenger.orderTime}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminDrawer>
  );
};

export default PassengerListDrawer;
