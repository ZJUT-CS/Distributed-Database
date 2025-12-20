import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, Plane, RefreshCw } from 'lucide-react';
import type { ConfirmedBooking, Flight, PassengerInfo } from '../../types';
import { request } from '../../lib/axios';
import { applyRefundChange } from '../../features/user/api/refund';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { searchOrders, type OrderSearchResult } from '../../features/booking/api/order';
import FlightList from '../../features/flight/components/FlightList';

type Step = 1 | 2 | 3;
type CabinType = 'economy' | 'business' | 'first';

const parsePassengersJson = (raw?: string | null): PassengerInfo[] | undefined => {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as any;
    if (!Array.isArray(parsed)) return undefined;
    const next = parsed
      .map((p) => ({
        name: String(p?.name ?? '').trim(),
        idCard: String(p?.idCard ?? '').trim(),
        type: (p?.type === 'child' ? 'child' : 'adult') as 'child' | 'adult',
      }))
      .filter((p) => !!p.name || !!p.idCard);
    return next.length > 0 ? next : undefined;
  } catch {
    return undefined;
  }
};

const mapOrderToBooking = (o: OrderSearchResult): ConfirmedBooking => ({
  id: String(o.orderNo),
  flight: {
    id: o.flightNo || '',
    airline: '',
    airlineCode: (o.flightNo || '').replace(/[^A-Z]/g, '').slice(0, 2),
    flightNumber: o.flightNo || '',
    cabinType: 'economy',
    origin: o.origin || '',
    destination: o.destination || '',
    departureTime: o.departureTime || '',
    arrivalTime: o.arrivalTime || '',
    price: Number(o.totalAmount || 0),
    remainingSeats: 0,
    duration: '',
    stops: 0,
    baggageWeight: 23,
    amenities: { hasPower: false, hasMeal: true, hasWifi: false, hasEntertainment: false },
  },
  flights: [
    {
      id: o.flightNo || '',
      airline: '',
      airlineCode: (o.flightNo || '').replace(/[^A-Z]/g, '').slice(0, 2),
      flightNumber: o.flightNo || '',
      cabinType: 'economy',
      origin: o.origin || '',
      destination: o.destination || '',
      departureTime: o.departureTime || '',
      arrivalTime: o.arrivalTime || '',
      price: Number(o.totalAmount || 0),
      remainingSeats: 0,
      duration: '',
      stops: 0,
      baggageWeight: 23,
      amenities: { hasPower: false, hasMeal: true, hasWifi: false, hasEntertainment: false },
    },
  ],
  status:
    o.orderStatus === 0
      ? 'pending_payment'
      : o.orderStatus === 2
      ? 'cancelled'
      : o.orderStatus === 3
      ? 'refunded'
      : o.orderStatus === 4
      ? 'refunding'
      : o.orderStatus === 5
      ? 'changed'
      : 'confirmed',
  bookingDate: o.orderTime || new Date().toISOString(),
  passengerName: o.passengerName || '',
  passportNumber: '',
  passengers: parsePassengersJson(o.passengersJson),
  contactEmail: o.contactEmail || '',
  phone: o.contactPhone || '',
  totalPrice: Number(o.totalAmount || 0),
});

const pad2 = (n: number) => String(n).padStart(2, '0');

const toDateInputValue = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const estimateChangeFee = (departureTime?: string) => {
  if (!departureTime) return 50;
  const t = new Date(departureTime).getTime();
  if (!Number.isFinite(t)) return 50;
  const diffMs = t - Date.now();
  const hours = diffMs / 3600000;
  if (hours <= 6) return 300;
  if (hours <= 24) return 200;
  if (hours <= 72) return 100;
  return 50;
};

const ChangeFlightPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const orderNo = (searchParams.get('orderNo') || '').trim();
  const passedBooking = (location.state as any)?.booking as ConfirmedBooking | undefined;

  const [booking, setBooking] = useState<ConfirmedBooking | null>(passedBooking ?? null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>(1);
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date(Date.now() + 24 * 3600000)));
  const [cabinType, setCabinType] = useState<CabinType>('economy');

  const [passengerCount, setPassengerCount] = useState(1);

  const [loadingFlights, setLoadingFlights] = useState(false);
  const [flightError, setFlightError] = useState<string | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);

  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (passedBooking) return;
    if (!orderNo) return;
    if (!user?.id) return;

    setBookingLoading(true);
    setBookingError(null);
    searchOrders({ userId: user.id, orderNo })
      .then((res) => {
        if (!res || res.length === 0) {
          setBooking(null);
          setBookingError('未找到订单');
          return;
        }
        setBooking(mapOrderToBooking(res[0]));
      })
      .catch((e: any) => setBookingError(e?.message || '加载订单失败'))
      .finally(() => setBookingLoading(false));
  }, [orderNo, passedBooking, user?.id]);

  useEffect(() => {
    if (!booking) return;
    const n = booking.passengers?.length ? booking.passengers.length : 1;
    setPassengerCount(n);
  }, [booking]);

  const oldFlight = useMemo(() => {
    if (!booking) return null;
    const fs = booking.flights && booking.flights.length > 0 ? booking.flights : booking.flight ? [booking.flight] : [];
    return fs[0] || null;
  }, [booking]);

  const origin = oldFlight?.origin || '';
  const destination = oldFlight?.destination || '';

  const oldTotal = useMemo(() => {
    if (!booking) return 0;
    if (typeof booking.totalPrice === 'number' && Number.isFinite(booking.totalPrice)) return booking.totalPrice;
    if (booking.flight?.price && Number.isFinite(booking.flight.price)) return booking.flight.price;
    return 0;
  }, [booking]);

  const oldUnitPrice = useMemo(() => {
    const n = passengerCount > 0 ? passengerCount : 1;
    return oldTotal / n;
  }, [oldTotal, passengerCount]);

  const fee = useMemo(() => estimateChangeFee(oldFlight?.departureTime), [oldFlight?.departureTime]);

  const diffUnit = useMemo(() => {
    if (!selectedFlight) return 0;
    return Number(selectedFlight.price || 0) - oldUnitPrice;
  }, [selectedFlight, oldUnitPrice]);

  const diffTotal = useMemo(() => diffUnit * passengerCount, [diffUnit, passengerCount]);
  const totalDue = useMemo(() => diffTotal + fee, [diffTotal, fee]);

  const formatMoney = (n: number) => {
    const v = Number.isFinite(n) ? n : 0;
    return Math.round(v).toLocaleString();
  };

  const fetchFlights = async () => {
    const o = origin.trim();
    const d = destination.trim();
    const dt = selectedDate.trim();
    if (!o || !d || !dt) {
      setFlights([]);
      setFlightError('查询参数不完整');
      return;
    }

    setLoadingFlights(true);
    setFlightError(null);
    setSelectedFlight(null);
    try {
      const data = await request<
        Array<{
          flightNo: string;
          departurePlace: string;
          destination: string;
          departureTime: string;
          arrivalTime: string;
          duration: string;
          price?: number;
          remainingSeats?: number;
          airlineCompany?: string;
          cabinType?: string;
        }>
      >({
        method: 'GET',
        url: '/flights/search',
        params: {
          departurePlace: o,
          destination: d,
          departureDate: dt,
          cabinType,
        },
      });

      const mapped: Flight[] = (data || []).map((r) => ({
        id: r.flightNo || `${r.departurePlace}-${r.destination}-${r.departureTime}`,
        airline: r.airlineCompany || '',
        airlineCode: (r.flightNo || '').replace(/[^A-Z]/g, '').slice(0, 2),
        flightNumber: r.flightNo || '',
        cabinType: r.cabinType,
        origin: r.departurePlace,
        destination: r.destination,
        departureTime: r.departureTime,
        arrivalTime: r.arrivalTime,
        price: Number(r.price ?? 0),
        remainingSeats: typeof r.remainingSeats === 'number' ? r.remainingSeats : undefined,
        duration: r.duration || '',
        stops: 0,
        baggageWeight: 23,
        amenities: { hasPower: false, hasMeal: true, hasWifi: false, hasEntertainment: false },
      }));

      const valid = mapped.filter((f) => f.flightNumber && f.departureTime);
      setFlights(valid);
      setStep(2);
    } catch (e: any) {
      setFlights([]);
      setFlightError(e?.message || '加载航班失败');
    } finally {
      setLoadingFlights(false);
    }
  };

  const renderDiff = (newPrice: number) => {
    const diff = newPrice - oldUnitPrice;
    const abs = Math.abs(diff);
    const isPay = diff > 0.000001;
    const isRefund = diff < -0.000001;
    if (!isPay && !isRefund) {
      return (
        <div className="text-right">
          <div className="text-[11px] text-gray-400">差价</div>
          <div className="text-2xl font-extrabold text-emerald-600">+¥0</div>
          <div className="text-xs text-gray-400">免费改签</div>
        </div>
      );
    }
    if (isPay) {
      return (
        <div className="text-right">
          <div className="text-[11px] text-gray-400">差价</div>
          <div className="text-2xl font-extrabold text-orange-600">+¥{formatMoney(abs)}</div>
          <div className="text-xs text-gray-400">需补差价</div>
        </div>
      );
    }
    return (
      <div className="text-right">
        <div className="text-[11px] text-gray-400">差价</div>
        <div className="text-2xl font-extrabold text-sky-700">-¥{formatMoney(abs)}</div>
        <div className="text-xs text-gray-400">预计可退</div>
      </div>
    );
  };

  const handleSelectFlight = (f: Flight) => {
    setSelectedFlight(f);
    setStep(3);
  };

  const submit = async () => {
    if (!booking || !selectedFlight) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const chosenCabin = (selectedFlight.cabinType as any) || cabinType;
      const remarkParts = [
        `日期:${selectedDate}`,
        `人数:${passengerCount}`,
        `差价:${Math.round(diffTotal)}`,
        `手续费:${fee}`,
      ];

      const recordId = await applyRefundChange({
        orderNo: booking.id,
        operType: 2,
        remark: remarkParts.join(' '),
        newFlightNo: selectedFlight.flightNumber,
        newCabinType: String(chosenCabin),
      });

      navigate('/refunds-help', { state: { focusId: String(recordId) } });
    } catch (e: any) {
      setSubmitError(e?.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingLoading) {
    return (
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-10">
        <div className="rounded-3xl border border-sky-100 bg-white p-8 text-sm text-gray-600">加载订单中...</div>
      </div>
    );
  }

  if (!booking || !oldFlight) {
    return (
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-10">
        <div className="rounded-3xl border border-red-100 bg-red-50 p-8">
          <div className="text-lg font-extrabold text-red-700">无法办理改签</div>
          <div className="text-sm text-red-700/80 mt-1">{bookingError || '缺少订单信息'}</div>
          <button
            type="button"
            onClick={() => navigate('/my-bookings')}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-red-100 text-red-700 text-sm font-bold hover:bg-red-50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> 返回我的订单
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-10 animate-fade-in-up">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm text-gray-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">办理改签</h2>
            <div className="text-sm text-gray-500 mt-1">订单号：{booking.id}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/refunds-help')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all"
        >
          <RefreshCw className="w-4 h-4" /> 退改/售后
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
            <span className={`px-2.5 py-1 rounded-full border ${step === 1 ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-gray-50 border-gray-100'}`}>
              1. 选择范围
            </span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
            <span className={`px-2.5 py-1 rounded-full border ${step === 2 ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-gray-50 border-gray-100'}`}>
              2. 选择新航班
            </span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
            <span className={`px-2.5 py-1 rounded-full border ${step === 3 ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-gray-50 border-gray-100'}`}>
              3. 确认提交
            </span>
          </div>

          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="text-xs font-bold text-gray-500">原行程（将被替换）</div>
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Plane className="w-5 h-5 text-gray-400" />
                    <span className="truncate">
                      {oldFlight.origin} → {oldFlight.destination} {oldFlight.flightNumber}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(oldFlight.departureTime).toLocaleString('zh-CN')}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span>原票价：¥{formatMoney(oldUnitPrice)} / 人</span>
                    <span className="text-gray-300">·</span>
                    <span>默认人数：{passengerCount}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">订单总价</div>
                  <div className="text-xl font-extrabold text-gray-900">¥{formatMoney(oldTotal)}</div>
                </div>
              </div>
            </div>

            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="text-sm font-extrabold text-gray-900">乘客/张数</div>
                  <div className="text-xs text-gray-500 mt-1">当前系统按整单改签，人数仅用于差价展示</div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPassengerCount((n) => Math.max(1, n - 1))}
                      className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-extrabold text-gray-700"
                    >
                      -
                    </button>
                    <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-center font-extrabold text-gray-900">
                      {passengerCount}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPassengerCount((n) => Math.min(9, n + 1))}
                      className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-extrabold text-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="text-sm font-extrabold text-gray-900">选择新日期</div>
                  <div className="text-xs text-gray-500 mt-1">出发地/目的地将锁定为原订单城市</div>
                  <div className="mt-4">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      min={toDateInputValue(new Date())}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="text-sm font-extrabold text-gray-900">舱位</div>
                  <div className="text-xs text-gray-500 mt-1">支持升舱/降舱筛选</div>
                  <div className="mt-4">
                    <select
                      value={cabinType}
                      onChange={(e) => setCabinType(e.target.value as CabinType)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    >
                      <option value="economy">经济舱</option>
                      <option value="business">商务舱</option>
                      <option value="first">头等舱</option>
                    </select>
                  </div>
                </div>

                <div className="lg:col-span-3">
                  {flightError && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {flightError}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={fetchFlights}
                    disabled={loadingFlights}
                    className="mt-2 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-extrabold hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loadingFlights ? '搜索中...' : '查找新航班'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-extrabold text-gray-900">可改签航班列表（{selectedDate}）</div>
                    <div className="text-xs text-gray-500 mt-1">
                      差价按“新票价 - 原票价（¥{formatMoney(oldUnitPrice)}/人）”计算
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={cabinType}
                      onChange={(e) => setCabinType(e.target.value as CabinType)}
                      className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-800"
                    >
                      <option value="economy">经济舱</option>
                      <option value="business">商务舱</option>
                      <option value="first">头等舱</option>
                    </select>
                    <button
                      type="button"
                      onClick={fetchFlights}
                      disabled={loadingFlights}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-all disabled:opacity-70"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingFlights ? 'animate-spin' : ''}`} />
                      刷新
                    </button>
                  </div>
                </div>

                {flightError && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {flightError}
                  </div>
                )}

                <FlightList
                  flights={flights}
                  onSelect={handleSelectFlight}
                  renderPrice={(f) => renderDiff(Number(f.price || 0))}
                  renderAction={(f) => (
                    <button
                      type="button"
                      onClick={() => handleSelectFlight(f)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      选择 <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                />

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> 返回修改条件
                  </button>
                  <div className="text-xs text-gray-500">
                    人数：{passengerCount} · 舱位：{cabinType}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && selectedFlight && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-xs font-bold text-gray-500">原航班</div>
                    <div className="mt-2 text-lg font-extrabold text-gray-900">
                      {oldFlight.flightNumber} · {oldFlight.origin} → {oldFlight.destination}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {new Date(oldFlight.departureTime).toLocaleString('zh-CN')}
                    </div>
                    <div className="mt-3 text-sm text-gray-700">
                      原票价抵扣：-¥{formatMoney(oldUnitPrice * passengerCount)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
                    <div className="text-xs font-bold text-blue-700">新航班</div>
                    <div className="mt-2 text-lg font-extrabold text-gray-900">
                      {selectedFlight.flightNumber} · {selectedFlight.origin} → {selectedFlight.destination}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {new Date(selectedFlight.departureTime).toLocaleString('zh-CN')}
                    </div>
                    <div className="mt-3 text-sm text-gray-700">新票价：¥{formatMoney(selectedFlight.price * passengerCount)}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-extrabold text-gray-900">费用明细</div>
                    <div className="text-xs text-gray-500">人数：{passengerCount} · 舱位：{cabinType}</div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <span className="text-gray-600">新票价</span>
                      <span className="font-extrabold text-gray-900">¥{formatMoney(selectedFlight.price * passengerCount)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <span className="text-gray-600">原票价抵扣</span>
                      <span className="font-extrabold text-gray-900">-¥{formatMoney(oldUnitPrice * passengerCount)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <span className="text-gray-600">改签手续费（预估）</span>
                      <span className="font-extrabold text-gray-900">+¥{formatMoney(fee)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <span className="text-gray-600">差价小计</span>
                      <span className="font-extrabold text-gray-900">
                        {diffTotal >= 0 ? '+' : '-'}¥{formatMoney(Math.abs(diffTotal))}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-900 px-5 py-4 text-white">
                    <div>
                      <div className="text-xs text-white/70">总计</div>
                      <div className="text-2xl font-extrabold">
                        {totalDue >= 0 ? '¥' + formatMoney(totalDue) : '-¥' + formatMoney(Math.abs(totalDue))}
                      </div>
                      <div className="text-xs text-white/70 mt-1">{totalDue >= 0 ? '需补（含手续费）' : '预计可退（含手续费）'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/70">提交后</div>
                      <div className="text-sm font-bold">{totalDue >= 0 ? '进入审核并提示补差价' : '进入审核并原路退差价'}</div>
                    </div>
                  </div>

                  {submitError && (
                    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {submitError}
                    </div>
                  )}

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={submitting}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all disabled:opacity-70"
                    >
                      返回重新选择
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={submitting}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {submitting ? '提交中...' : '提交改签申请'}
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeFlightPage;

