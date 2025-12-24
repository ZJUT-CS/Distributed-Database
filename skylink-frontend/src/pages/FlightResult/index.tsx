
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SearchForm, FilterSidebar, FlightList, FlightListSkeleton, TripSummary, type Flight, type SearchParams, type FilterState, type MapPoint } from '@/features/flight';
import { WorldMap } from '@/components';
import { POPULAR_AIRPORTS as AIRPORTS_CONST } from '@/constants';
import { Plane, Filter, MoveRight } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { searchFlights } from '@/features/flight/api/search';

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatLocalYmd = (d: Date) => {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const FlightResultPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [urlParams] = useSearchParams();
  const { user } = useAuth();

  // State
  const [origin, setOrigin] = useState(urlParams.get('origin') || 'PEK');
  const [destination, setDestination] = useState(urlParams.get('destination') || 'SHA');
  const [date, setDate] = useState(urlParams.get('date') || formatLocalYmd(new Date()));
  const [passengers, setPassengers] = useState(() => {
    const raw = Number(urlParams.get('passengers') || 1);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  });
  const [cabinClass, setCabinClass] = useState<'economy' | 'business' | 'first'>(() => {
    const raw = urlParams.get('cabinClass');
    if (raw === 'business' || raw === 'first' || raw === 'economy') return raw;
    return 'economy';
  });

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [flightError, setFlightError] = useState<string | null>(null);
  const [selectedFlights, setSelectedFlights] = useState<Flight[]>([]);
  const [currentLegIndex, setCurrentLegIndex] = useState(0);
  const [tripSegments, setTripSegments] = useState<any[]>([]); // Should be TripSegment[]

  const [filters, setFilters] = useState<FilterState>({
    stops: 'all',
    airlines: [],
    priceMax: 10000,
    departureTime: [],
    arrivalTime: [],
    originAirports: [],
    destinationAirports: [],
    durationMax: 1440
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [userMapPoints, setUserMapPoints] = useState<MapPoint[]>([]);
  const [userMapRoutes, setUserMapRoutes] = useState<Array<{ from: string; to: string }>>([]);

  const fetchFlights = async (orig: string, dest: string, dt: string) => {
    const o = (orig || '').trim();
    const d = (dest || '').trim();
    const dateStr = (dt || '').trim();

    setLoadingFlights(true);
    setFlightError(null);
    try {
      const mapped = await searchFlights({ origin: o, destination: d, departureDate: dateStr });
      setFlights(mapped);
    } catch (e: any) {
      setFlights([]);
      setFlightError(e?.message || '查询航班失败');
    } finally {
      setLoadingFlights(false);
    }
  };

  // Initialize from location state or URL
  useEffect(() => {
    const stateParams = location.state?.searchParams as SearchParams;
    if (stateParams) {
      setTripSegments(stateParams.segments);
      setPassengers(stateParams.passengers);
      setCabinClass(stateParams.cabinClass || 'economy');
      // Initial search for first leg
      const firstLeg = stateParams.segments[0];
      setOrigin(firstLeg.origin);
      setDestination(firstLeg.destination);
      setDate(firstLeg.date);
      fetchFlights(firstLeg.origin, firstLeg.destination, firstLeg.date);
    } else {
      // Fallback to URL params for single leg
      const segs = [{ origin, destination, date }];
      setTripSegments(segs);
      fetchFlights(origin, destination, date);
    }
  }, [location.state, urlParams]); // Re-run if URL changes (e.g. from Navbar search)

  // Handle Search Form Update
  const handleSearch = (params: SearchParams) => {
    setTripSegments(params.segments);
    setSelectedFlights([]);
    setCurrentLegIndex(0);
    setPassengers(params.passengers);
    setCabinClass(params.cabinClass || 'economy');

    const firstLeg = params.segments[0];
    setOrigin(firstLeg.origin);
    setDestination(firstLeg.destination);
    setDate(firstLeg.date);
    fetchFlights(firstLeg.origin, firstLeg.destination, firstLeg.date);

    // Update URL without reload
    const newParams = new URLSearchParams();
    newParams.set('origin', firstLeg.origin);
    newParams.set('destination', firstLeg.destination);
    newParams.set('date', firstLeg.date);
    newParams.set('passengers', String(params.passengers));
    if (params.cabinClass) newParams.set('cabinClass', params.cabinClass);
    navigate(`?${newParams.toString()}`, { replace: true, state: { searchParams: params } });
  };

  const handleFlightSelect = (flight: Flight) => {
    const newSelected = [...selectedFlights];
    newSelected[currentLegIndex] = flight;
    setSelectedFlights(newSelected);

    if (currentLegIndex < tripSegments.length - 1) {
      // Next leg
      const nextIndex = currentLegIndex + 1;
      const nextLeg = tripSegments[nextIndex];
      setCurrentLegIndex(nextIndex);
      setOrigin(nextLeg.origin);
      setDestination(nextLeg.destination);
      setDate(nextLeg.date);
      fetchFlights(nextLeg.origin, nextLeg.destination, nextLeg.date);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Complete
      if (!user) {
        navigate('/login');
      } else {
        navigate('/booking', { state: { flights: newSelected, passengers, cabinClass } });
      }
    }
  };

  const handleEditStep = (index: number) => {
    if (index >= 0 && index < tripSegments.length) {
      setCurrentLegIndex(index);
      const leg = tripSegments[index];
      setOrigin(leg.origin);
      setDestination(leg.destination);
      setDate(leg.date);
      fetchFlights(leg.origin, leg.destination, leg.date);

      // Truncate selection
      setSelectedFlights(prev => prev.slice(0, index));
    }
  };

  // Helper to parse duration string "X小时 Y分" to minutes
  const parseDuration = (dur: string): number => {
    const cnH = dur.match(/(\d+)小时/);
    const cnM = dur.match(/(\d+)分/);
    if (cnH || cnM) {
      const h = cnH ? parseInt(cnH[1]) : 0;
      const m = cnM ? parseInt(cnM[1]) : 0;
      return h * 60 + m;
    }

    const enH = dur.match(/(\d+)\s*h/i);
    const enM = dur.match(/(\d+)\s*m/i);
    const h = enH ? parseInt(enH[1]) : 0;
    const m = enM ? parseInt(enM[1]) : 0;
    return h * 60 + m;
  };

  // Filter Logic
  const filteredFlights = useMemo(() => {
    const cabinMultiplier = cabinClass === 'first' ? 2.1 : cabinClass === 'business' ? 1.6 : 1;

    // 时段判断辅助函数
    const getTimeSlot = (timeStr: string): string => {
      if (!timeStr) return '';
      const hour = new Date(timeStr).getHours();
      if (hour >= 6 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 18) return 'afternoon';
      if (hour >= 18 && hour < 24) return 'evening';
      return 'night'; // 00:00-06:00
    };

    return flights
      .filter((flight) => {
        const effectivePrice = flight.price * cabinMultiplier;
        if (effectivePrice > filters.priceMax) return false;
        if (typeof flight.remainingSeats === 'number' && flight.remainingSeats < passengers) return false;
        if (filters.stops === 'direct' && flight.stops > 0) return false;
        if (filters.stops === '1stop' && flight.stops !== 1) return false;
        if (filters.airlines.length > 0 && !filters.airlines.includes(flight.airlineCode)) return false;
        if (parseDuration(flight.duration) > filters.durationMax) return false;

        // 🔧 起飞时段筛选（兼容联程航班：取第一段起飞时间）
        if (filters.departureTime.length > 0) {
          const depTime = (flight as any).segments?.[0]?.departureTime || flight.departureTime;
          const slot = getTimeSlot(depTime);
          if (slot && !filters.departureTime.includes(slot)) return false;
        }

        // 🔧 出发机场筛选（兼容联程航班：取第一段出发机场）
        if (filters.originAirports.length > 0) {
          const originCode = (flight as any).segments?.[0]?.originCode || flight.originCode;
          if (originCode && !filters.originAirports.includes(originCode)) return false;
        }

        // 🔧 到达机场筛选（兼容联程航班：取最后一段到达机场）
        if (filters.destinationAirports.length > 0) {
          const segments = (flight as any).segments || [];
          const destCode = segments.length > 0
            ? segments[segments.length - 1].destinationCode
            : flight.destinationCode;
          if (destCode && !filters.destinationAirports.includes(destCode)) return false;
        }

        return true;
      })
      .map((flight) => ({
        ...flight,
        price: Math.round(flight.price * cabinMultiplier),
      }));
  }, [flights, filters, cabinClass, passengers]);

  // Map Data
  const getCityName = (code: string) => AIRPORTS_CONST.find(a => a.code === code)?.city || code;

  const getRouteMapData = () => {
    const originAirport = AIRPORTS_CONST.find(a => a.code === origin) || AIRPORTS_CONST.find(a => a.city === origin);
    const destAirport = AIRPORTS_CONST.find(a => a.code === destination) || AIRPORTS_CONST.find(a => a.city === destination);

    if (!originAirport || !destAirport) return { points: [], routes: [] };

    const points: MapPoint[] = [
      { id: originAirport.code, name: originAirport.name, lat: originAirport.lat, lng: originAirport.lng, type: 'origin', value: 100, info: '出发地' },
      { id: destAirport.code, name: destAirport.name, lat: destAirport.lat, lng: destAirport.lng, type: 'destination', value: 100, info: '目的地' }
    ];

    const routes = [{ from: originAirport.code, to: destAirport.code }];
    return { points, routes };
  };

  const mapData = useMemo(() => getRouteMapData(), [origin, destination]);
  const mergedMapPoints = useMemo(() => [...mapData.points, ...userMapPoints], [mapData.points, userMapPoints]);
  const mergedMapRoutes = useMemo(() => [...mapData.routes, ...userMapRoutes], [mapData.routes, userMapRoutes]);

  const handleAiRequest = () => {
    if (!user) navigate('/login');
    else window.dispatchEvent(new CustomEvent('open-ai-modal'));
  };

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Map Banner */}
      <div className="w-full h-[640px] bg-gradient-to-br from-slate-900 via-[#0f172a] to-indigo-950 relative overflow-hidden border-b border-gray-800 shadow-inner group">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent pointer-events-none"></div>

        <WorldMap
          points={mergedMapPoints}
          routes={mergedMapRoutes}
          className="h-full w-full rounded-none border-none opacity-100"
          showGrid={true}
          theme="dark"
          enableControls={true}
          minZoomLevel={3}
          maxZoomLevel={18}
          defaultZoomLevel={10}
          preserveAspectRatio="xMidYMid meet"
          onReset={() => {
            setUserMapPoints([]);
            setUserMapRoutes([]);
          }}
        />

        {/* Overlay */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-800/80 backdrop-blur-md px-6 py-3 rounded-full border border-slate-600 shadow-2xl flex items-center gap-8 animate-fade-in-down z-10 pointer-events-none">
          <div className="flex flex-col items-end">
            <span className="text-xs text-blue-400 font-mono tracking-wider">出发地</span>
            <span className="font-bold text-2xl text-white tracking-tight">{origin}</span>
            <span className="text-xs text-gray-400">{getCityName(origin)}</span>
          </div>

          <div className="flex items-center text-blue-500 relative">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse absolute -left-1"></div>
            <div className="w-32 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500 to-blue-500/10"></div>
            <Plane className="w-5 h-5 absolute left-1/2 -translate-x-1/2 text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse absolute -right-1"></div>
          </div>

          <div className="flex flex-col items-start">
            <span className="text-xs text-emerald-400 font-mono tracking-wider">目的地</span>
            <span className="font-bold text-2xl text-white tracking-tight">{destination}</span>
            <span className="text-xs text-gray-400">{getCityName(destination)}</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <SearchForm
          onSearch={handleSearch}
          onAiRequest={handleAiRequest}
          isAiLoading={false}
          origin={origin}
          setOrigin={setOrigin}
          destination={destination}
          setDestination={setDestination}
          compact={true}
          initialValues={{
            tripType: 'oneWay',
            segments: tripSegments.length ? tripSegments : [{ origin, destination, date }],
            passengers,
            cabinClass
          } as any}
        />

        <div className="mt-8 animate-fade-in-up">
          <TripSummary
            segments={tripSegments}
            selectedFlights={selectedFlights}
            currentLegIndex={currentLegIndex}
            onEditStep={handleEditStep}
          />

          <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
            <div className="lg:hidden mb-2">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="w-full flex items-center justify-center gap-2 bg-white p-3 rounded-xl shadow-sm border border-gray-200 text-blue-600 font-bold"
              >
                <Filter className="w-4 h-4" /> {showMobileFilters ? '隐藏筛选' : '显示筛选'}
              </button>
            </div>

            <div className={`lg:col-span-1 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
              <FilterSidebar
                filters={filters}
                onFilterChange={setFilters}
              />
            </div>

            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="bg-blue-600 w-1 h-5 rounded-full inline-block"></span>
                  可选航班 ({getCityName(origin)} → {getCityName(destination)})
                </h2>
                <span className="text-gray-500 text-sm font-medium bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                  {filteredFlights.length} / {flights.length} 结果
                </span>
              </div>

              {loadingFlights && (
                <FlightListSkeleton count={4} />
              )}

              {!loadingFlights && flightError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
                  <span>{flightError}</span>
                  <button
                    type="button"
                    onClick={() => fetchFlights(origin, destination, date)}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold"
                  >
                    重试
                  </button>
                </div>
              )}

              <FlightList flights={filteredFlights} onSelect={handleFlightSelect} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightResultPage;
