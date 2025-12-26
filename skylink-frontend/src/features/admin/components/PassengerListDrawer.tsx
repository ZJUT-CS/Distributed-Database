import React from 'react';
import { Users, Plane } from 'lucide-react';
import AdminDrawer from './AdminDrawer';
import AdminBadge from './AdminBadge';
import { listFlightPassengers, type FlightPassengerItem } from '../api/flights';
import { formatDateTimeZhCN } from '@/shared/utils/formatters';

export interface PassengerDrawerProps {
  open: boolean;
  onClose: () => void;
  flightNo: string;
  flightId?: string;
}

export interface PassengerInfo {
  orderId: string;
  orderNo: string;
  passengerName: string;
  contactEmail: string;
  contactPhone: string;
  userRealName: string | null;
  userPhone: string | null;
  userEmail: string | null;
  seatId: string | null;
  totalAmount: number;
  orderStatus: number;
  createTime: string;
  departureCity: string;
  departureAirport: string;
  arrivalCity: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
}

const STATUS_MAP: Record<number, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  0: { label: '待审核', variant: 'warning' },
  1: { label: '待支付', variant: 'warning' },
  2: { label: '已支付', variant: 'success' },
  3: { label: '审核拒绝', variant: 'danger' },
  4: { label: '退款审核中', variant: 'info' },
  5: { label: '已退款', variant: 'danger' },
  6: { label: '已取消', variant: 'danger' },
};

const toPassengerInfo = (item: FlightPassengerItem): PassengerInfo => ({
  orderId: String(item.orderId ?? ''),
  orderNo: String(item.orderNo ?? ''),
  passengerName: String(item.passengerName ?? '-').trim(),
  contactEmail: String(item.contactEmail ?? '-').trim(),
  contactPhone: String(item.contactPhone ?? '-').trim(),
  userRealName: item.userRealName ?? null,
  userPhone: item.userPhone ?? null,
  userEmail: item.userEmail ?? null,
  seatId: item.seatId != null ? String(item.seatId) : null,
  totalAmount: item.totalAmount ?? 0,
  orderStatus: item.orderStatus ?? 0,
  createTime: String(item.createTime ?? ''),
  departureCity: String(item.departureCity ?? '-'),
  departureAirport: String(item.departureAirport ?? '-'),
  arrivalCity: String(item.arrivalCity ?? '-'),
  arrivalAirport: String(item.arrivalAirport ?? '-'),
  departureTime: String(item.departureTime ?? ''),
  arrivalTime: String(item.arrivalTime ?? ''),
});

const PassengerListDrawer: React.FC<PassengerDrawerProps> = ({ open, onClose, flightNo, flightId }) => {
  const [passengers, setPassengers] = React.useState<PassengerInfo[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && flightNo) {
      setLoading(true);
      listFlightPassengers({ flightNo, page: 1, size: 100 })
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

  const totalAmount = passengers.reduce((sum, p) => sum + p.totalAmount, 0);

  const subtitle = `航班号: ${flightNo}${flightId ? ` | ID: ${flightId}` : ''}`;

  const firstPassenger = passengers[0];

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
          {firstPassenger && (
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">航班信息</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-gray-500">出发</div>
                  <div className="font-medium">{firstPassenger.departureCity} ({firstPassenger.departureAirport})</div>
                  <div className="text-gray-400">{formatDateTimeZhCN(firstPassenger.departureTime)}</div>
                </div>
                <div>
                  <div className="text-gray-500">到达</div>
                  <div className="font-medium">{firstPassenger.arrivalCity} ({firstPassenger.arrivalAirport})</div>
                  <div className="text-gray-400">{formatDateTimeZhCN(firstPassenger.arrivalTime)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{passengers.length}</div>
              <div className="text-xs text-gray-500">订单数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">¥{totalAmount.toLocaleString()}</div>
              <div className="text-xs text-gray-500">总金额</div>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {passengers.map((passenger) => {
              const statusInfo = STATUS_MAP[passenger.orderStatus] ?? { label: '未知', variant: 'info' };
              return (
                <div key={passenger.orderId} className="p-4 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {passenger.passengerName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{passenger.passengerName}</div>
                        <div className="text-xs text-gray-500 font-mono">{passenger.orderNo}</div>
                      </div>
                    </div>
                    <AdminBadge size="sm" variant={statusInfo.variant}>
                      {statusInfo.label}
                    </AdminBadge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">联系人电话:</span>
                      <span className="font-medium">{passenger.contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">联系人邮箱:</span>
                      <span className="font-medium truncate max-w-[120px]">{passenger.contactEmail}</span>
                    </div>
                  </div>
                  {passenger.userRealName && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">用户姓名:</span>
                        <span className="font-medium">{passenger.userRealName}</span>
                      </div>
                      {passenger.userPhone && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">用户电话:</span>
                          <span className="font-medium">{passenger.userPhone}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    {passenger.seatId && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">座位ID:</span>
                        <span className="font-medium">{passenger.seatId}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">金额:</span>
                      <span className="font-medium text-indigo-600">¥{passenger.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    预订时间: {formatDateTimeZhCN(passenger.createTime)}
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
