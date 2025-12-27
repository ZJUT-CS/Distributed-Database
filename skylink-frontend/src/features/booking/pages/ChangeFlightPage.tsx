import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, Plane, RefreshCw } from 'lucide-react';
import { type ConfirmedBooking, type PassengerInfo } from '@/features/booking';
import { type Flight, FlightList } from '@/features/flight';
import { request } from '@/shared/api';
import { applyRefundChange } from '@/features/user/api/refund';
import { useAuth } from '@/features/auth';
import { searchOrders, type OrderSearchResult } from '@/features/booking/api/order';
import { ORDER_STATUS } from '@/features/admin/constants';

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
    id: String(o.flightId ?? '').trim(),
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
    amenities: { hasPower: false, hasMeal: true, hasWifi: false, hasEntertainment: false, hasPriorityBoarding: false, hasLieFlatSeats: false },
  },
  flights: [
    {
      id: String(o.flightId ?? '').trim(),
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
      amenities: { hasPower: false, hasMeal: true, hasWifi: false, hasEntertainment: false, hasPriorityBoarding: false, hasLieFlatSeats: false },
    },
  ],
  status:
    o.orderStatus === ORDER_STATUS.PENDING_PAYMENT
      ? 'pending_payment'
      : o.orderStatus === ORDER_STATUS.CONFIRMED
        ? 'confirmed'
        : o.orderStatus === ORDER_STATUS.CANCELLED
          ? 'cancelled'
          : o.orderStatus === ORDER_STATUS.REFUNDED
            ? 'refunded'
            : o.orderStatus === ORDER_STATUS.PROCESSING
              ? 'refunding'
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
      const data = await request<{
        directFlights?: {
          total: number;
          data: Array<{
            flightId?: string | number;
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
          }>;
        };
        interlineFlights?: Array<{
          segments: Array<{
            flightId?: string | number;
            flightNo: string;
            departurePlace: string;
            destination: string;
            departureTime: string;
            arrivalTime: string;
            duration: string;
            price?: number;
          }>;
          totalPrice?: number;
        }>;
      }>({
        method: 'GET',
        url: '/api/v1/flights',
        params: {
          departurePlace: o,
          destination: d,
          departureDate: dt,
          page: '1',
          size: '50',
        },
      });

      const directFlights = data?.directFlights?.data ?? [];
      const mappedDirect: Flight[] = directFlights
        .map((r) => {
          const id = String(r.flightId ?? '').trim();
          if (!id) return null;
          return {
            id,
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
            amenities: { hasPower: false, hasMeal: true, hasWifi: false, hasEntertainment: false, hasPriorityBoarding: false, hasLieFlatSeats: false },
          } satisfies Flight;
        })
        .filter(Boolean) as Flight[];

      const interlineFlights = data?.interlineFlights ?? [];
      const mappedInterline: Flight[] = interlineFlights
        .map((it) => {
          const segs = it.segments ?? [];
          if (segs.length === 0) return null;

          const flightIds = segs.map((s) => String(s.flightId ?? '').trim()).filter(Boolean);
          if (flightIds.length !== segs.length) return null;

          const first = segs[0];
          const last = segs[segs.length - 1];
          const id = flightIds.join('+');
          return {
            id,
            airline: '',
            airlineCode: (first?.flightNo || '').replace(/[^A-Z]/g, '').slice(0, 2),
            flightNumber: segs.map((s) => s.flightNo).filter(Boolean).join('+') || 'INTERLINE',
            isInterline: true,
            cabinType: undefined,
            origin: first?.departurePlace || o,
            destination: last?.destination || d,
            departureTime: first?.departureTime || '',
            arrivalTime: last?.arrivalTime || '',
            price: Number(it.totalPrice ?? 0),
            remainingSeats: undefined,
            duration: '',
            stops: Math.max(0, segs.length - 1),
            baggageWeight: 23,
            amenities: { hasPower: false, hasMeal: true, hasWifi: false, hasEntertainment: false, hasPriorityBoarding: false, hasLieFlatSeats: false },
          } satisfies Flight;
        })
        .filter(Boolean) as Flight[];

      const allFlights = [...mappedDirect, ...mappedInterline];
      const valid = allFlights.filter((f) => f.flightNumber && f.departureTime);
      setFlights(valid);

      if (valid.length === 0) {
        setFlightError('未找到符合条件的航班，请尝试更换日期或目的地');
      } else {
        setStep(2);
      }
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
        newFlightId: selectedFlight.isInterline ? undefined : selectedFlight.id,
        newFlightIds: selectedFlight.isInterline ? selectedFlight.id.split('+').filter(Boolean) : undefined,
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

  if (!booking || !oldFlight || !String(oldFlight.id ?? '').trim()) {
    return (
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-10">
        <div className="rounded-3xl border border-red-100 bg-red-50 p-8">
          <div className="text-lg font-extrabold text-red-700">无法办理改签</div>
          <div className="text-sm text-red-700/80 mt-1">{bookingError || '缺少 flightId（链路锚点）'}</div>
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
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 hover:shadow-sm text-gray-600 dark:text-slate-400 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">办理改签</h2>
            <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">订单号：{booking.id}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/refunds-help')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
        >
          <RefreshCw className="w-4 h-4" /> 退改/售后
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-slate-400">
            <span className={`px-2.5 py-1 rounded-full border ${step === 1 ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-gray-50 border-gray-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500'}`}>
              1. 选择范围
            </span>
            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-slate-700" />
            <span className={`px-2.5 py-1 rounded-full border ${step === 2 ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-gray-50 border-gray-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500'}`}>
              2. 选择新航班
            </span>
            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-slate-700" />
            <span className={`px-2.5 py-1 rounded-full border ${step === 3 ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-gray-50 border-gray-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500'}`}>
              3. 确认提交
            </span>
          </div>

          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:bg-slate-800 dark:border-slate-700">
              <div className="text-xs font-bold text-gray-500 dark:text-slate-400">原行程（将被替换）</div>
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2 dark:text-white">
                    <Plane className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                    <span className="truncate">
                      {oldFlight.origin} → {oldFlight.destination} {oldFlight.flightNumber}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-2 flex-wrap dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(oldFlight.departureTime).toLocaleString('zh-CN')}
                    </span>
                    <span className="text-gray-300 dark:text-slate-600">·</span>
                    <span>原票价：¥{formatMoney(oldUnitPrice)} / 人</span>
                    <span className="text-gray-300 dark:text-slate-600">·</span>
                    <span>默认人数：{passengerCount}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-slate-400">订单总价</div>
                  <div className="text-xl font-extrabold text-gray-900 dark:text-white">¥{formatMoney(oldTotal)}</div>
                </div>
              </div>
            </div>

            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5">
                  <div className="text-sm font-extrabold text-gray-900 dark:text-white">乘客/张数</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">当前系统按整单改签，人数仅用于差价展示</div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPassengerCount((n) => Math.max(1, n - 1))}
                      className="w-10 h-10 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 font-extrabold text-gray-700 dark:text-slate-300"
                    >
                      -
                    </button>
                    <div className="flex-1 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/80 px-4 py-2.5 text-center font-extrabold text-gray-900 dark:text-white">
                      {passengerCount}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPassengerCount((n) => Math.min(9, n + 1))}
                      className="w-10 h-10 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 font-extrabold text-gray-700 dark:text-slate-300"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5">
                  <div className="text-sm font-extrabold text-gray-900 dark:text-white">选择新日期</div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={toDateInputValue(new Date(Date.now() + 24 * 3600000))}
                    className="mt-4 w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5">
                  <div className="text-sm font-extrabold text-gray-900 dark:text-white">舱位等级</div>
                  <div className="mt-4 space-y-2">
                    {(['economy', 'business', 'first'] as CabinType[]).map((ct) => (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => setCabinType(ct)}
                        className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${cabinType === ct
                          ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                          : 'bg-gray-50 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                          }`}
                      >
                        {ct === 'economy' ? '经济舱' : ct === 'business' ? '公务舱' : '头等舱'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <>
                {flightError && (
                  <div className="rounded-2xl border border-orange-100 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/20 p-4 text-sm text-orange-700 dark:text-orange-400">
                    {flightError}
                  </div>
                )}
                {loadingFlights ? (
                  <div className="text-center py-12 text-gray-500 dark:text-slate-400">加载航班中...</div>
                ) : flights.length > 0 ? (
                  <div className="space-y-4">
                    {flights.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => handleSelectFlight(f)}
                        className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 cursor-pointer hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                              <Plane className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                              <span className="truncate">
                                {f.origin} → {f.destination} {f.flightNumber}
                              </span>
                              {f.isInterline && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] font-bold">
                                  联程
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(f.departureTime).toLocaleString('zh-CN')}
                              </span>
                              <span className="text-gray-300 dark:text-slate-700">·</span>
                              <span>票价：¥{formatMoney(f.price)} / 人</span>
                            </div>
                          </div>
                          {renderDiff(Number(f.price))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 p-8 text-center text-gray-500 dark:text-slate-400">
                    未找到符合条件的航班，请尝试更换日期或目的地
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> 返回选择范围
                </button>
              </>
            )}

            {step === 3 && selectedFlight && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-sky-100 dark:border-sky-900/30 bg-sky-50 dark:bg-sky-900/10 p-5">
                  <div className="text-xs font-bold text-sky-700 dark:text-sky-400">已选择新航班</div>
                  <div className="mt-2 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-sky-600 dark:text-sky-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-base font-extrabold text-gray-900 dark:text-white truncate">
                        {selectedFlight.origin} → {selectedFlight.destination} {selectedFlight.flightNumber}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                        {new Date(selectedFlight.departureTime).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <div className="text-sm font-extrabold text-gray-900 dark:text-white mb-4">费用明细</div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-slate-400">原订单单价</span>
                      <span className="font-bold text-gray-900 dark:text-white">¥{formatMoney(oldUnitPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-slate-400">新航班单价</span>
                      <span className="font-bold text-gray-900 dark:text-white">¥{formatMoney(selectedFlight.price)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-slate-400">差价（单价）</span>
                      <span className={`font-bold ${diffTotal > 0 ? 'text-orange-600 dark:text-orange-400' : diffTotal < 0 ? 'text-sky-700 dark:text-sky-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {diffTotal > 0 ? '+' : ''}¥{formatMoney(diffUnit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-slate-400">人数</span>
                      <span className="font-bold text-gray-900 dark:text-white">{passengerCount} 人</span>
                    </div>
                    <div className="border-t border-gray-100 dark:border-slate-800 pt-3 flex items-center justify-between">
                      <span className="text-gray-600 dark:text-slate-400">差价总额</span>
                      <span className={`font-bold ${diffTotal > 0 ? 'text-orange-600 dark:text-orange-400' : diffTotal < 0 ? 'text-sky-700 dark:text-sky-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {diffTotal > 0 ? '+' : ''}¥{formatMoney(diffTotal)}
                      </span>
                    </div>
                    <div className="border-t border-gray-100 dark:border-slate-800 pt-3 flex items-center justify-between">
                      <span className="text-gray-600 dark:text-slate-400">改签手续费</span>
                      <span className="font-bold text-gray-900 dark:text-white">¥{formatMoney(fee)}</span>
                    </div>
                    <div className="border-t border-gray-100 dark:border-slate-800 pt-3 flex items-center justify-between text-base">
                      <span className="font-extrabold text-gray-900 dark:text-white">应付总额</span>
                      <span className={`font-extrabold ${totalDue > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-sky-700 dark:text-sky-400'}`}>
                        {totalDue > 0 ? '+' : ''}¥{formatMoney(totalDue)}
                      </span>
                    </div>
                  </div>
                </div>

                {submitError && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> 返回选择航班
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-700 shadow-lg shadow-sky-600/20 disabled:bg-gray-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-all"
                  >
                    {submitting ? '提交中...' : '确认改签'}
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={fetchFlights}
                disabled={loadingFlights}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
              >
                {loadingFlights ? '查询中...' : '查询可用航班'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeFlightPage;
