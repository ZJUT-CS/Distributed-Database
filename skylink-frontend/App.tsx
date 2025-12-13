
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Flight, SearchParams, BookingDetails, AIRecommendation, User, MapPoint, ConfirmedBooking, TripSegment, FilterState } from './types';
import { generateMockFlights, POPULAR_AIRPORTS } from './constants';
import { getDestinationGuide } from './services/geminiService';
import SearchForm from './components/SearchForm';
import FlightList from './components/FlightList';
import BookingForm from './components/BookingForm';
import LoginForm from './components/LoginForm';
import AiAssistantModal from './components/AiAssistantModal';
import AdminDashboard from './components/AdminDashboard';
import WorldMap from './components/WorldMap';
import UserBookings from './components/UserBookings';
import UserProfile from './components/UserProfile';
import UserSettings from './components/UserSettings';
import TripSummary from './components/TripSummary';
import FilterSidebar from './components/FilterSidebar';
import { Plane, Map as MapIcon, CheckCircle, Sparkles, User as UserIcon, Ticket, MoveRight, Filter, UserCog, LogOut, LayoutDashboard, Settings } from 'lucide-react';

type ViewState = 'home' | 'login' | 'results' | 'booking' | 'confirmation' | 'admin-dashboard' | 'my-bookings' | 'profile' | 'settings';

// Helper to parse duration string "X小时 Y分" to minutes (reused here for filtering)
const parseDuration = (dur: string): number => {
  const hMatch = dur.match(/(\d+)小时/);
  const mMatch = dur.match(/(\d+)分/);
  const h = hMatch ? parseInt(hMatch[1]) : 0;
  const m = mMatch ? parseInt(mMatch[1]) : 0;
  return h * 60 + m;
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [user, setUser] = useState<User | null>(null);
  
  // State for the inputs (Preview), split into Form (Stable) and Map (Dynamic during booking)
  const [formOrigin, setFormOrigin] = useState('PEK');
  const [formDestination, setFormDestination] = useState('SHA');
  const [mapOrigin, setMapOrigin] = useState('PEK');
  const [mapDestination, setMapDestination] = useState('SHA');

  // Multi-step Search State
  const [tripSegments, setTripSegments] = useState<TripSegment[]>([]);
  const [selectedFlights, setSelectedFlights] = useState<Flight[]>([]);
  const [currentLegIndex, setCurrentLegIndex] = useState(0);

  // User Menu State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Initial params just for the SearchForm to have defaults
  const [searchParams, setSearchParams] = useState<SearchParams>({
    tripType: 'oneWay',
    segments: [{ origin: 'PEK', destination: 'SHA', date: new Date().toISOString().split('T')[0] }],
    passengers: 1,
    passengerDetails: { adults: 1, children: 0, infants: 0 },
    cabinClass: 'economy'
  });

  const [flights, setFlights] = useState<Flight[]>([]);
  const [userBookings, setUserBookings] = useState<ConfirmedBooking[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiGuide, setAiGuide] = useState<string>('');
  const [loadingGuide, setLoadingGuide] = useState(false);
  
  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    stops: 'all',
    airlines: [],
    priceMax: 10000,
    departureTime: [],
    arrivalTime: [],
    originAirports: [],
    destinationAirports: [],
    durationMax: 1200 // 20 hours default
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Background Image based on view
  const getBgImage = () => {
    if (view === 'home' || view === 'login') return 'url("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop")';
    return 'none';
  };

  // Click Outside Listener for User Menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Unified handlers to sync Map with Form when user is typing
  const handleFormOriginChange = (val: string) => {
    setFormOrigin(val);
    setMapOrigin(val);
  };

  const handleFormDestinationChange = (val: string) => {
    setFormDestination(val);
    setMapDestination(val);
  };

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    // Initialize Trip
    setTripSegments(params.segments);
    setSelectedFlights([]); // Clear previous selections
    setCurrentLegIndex(0); // Start from first leg
    
    // Search for the first leg immediately
    const firstLeg = params.segments[0];
    const results = generateMockFlights(firstLeg.origin, firstLeg.destination, firstLeg.date);
    setFlights(results);
    
    // Reset filters
    const maxPrice = Math.max(...results.map(f => f.price), 5000);
    const maxDur = results.length > 0 
        ? Math.max(...results.map(f => parseDuration(f.duration))) 
        : 1200;

    setFilters({
      stops: 'all',
      airlines: [],
      priceMax: maxPrice,
      departureTime: [],
      arrivalTime: [],
      originAirports: [],
      destinationAirports: [],
      durationMax: maxDur
    });
    
    // Sync Map to first leg
    setMapOrigin(firstLeg.origin);
    setMapDestination(firstLeg.destination);
    
    setView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFlightSelect = (flight: Flight) => {
    // Add the selected flight to our list
    const newSelected = [...selectedFlights];
    newSelected[currentLegIndex] = flight;
    setSelectedFlights(newSelected);
    
    // Check if there are more legs
    if (currentLegIndex < tripSegments.length - 1) {
       // Proceed to next leg
       const nextIndex = currentLegIndex + 1;
       const nextLeg = tripSegments[nextIndex];
       
       setCurrentLegIndex(nextIndex);
       
       // Search for next leg
       const results = generateMockFlights(nextLeg.origin, nextLeg.destination, nextLeg.date);
       setFlights(results);
       
       // Reset filters for new leg
       const maxPrice = Math.max(...results.map(f => f.price), 5000);
       const maxDur = results.length > 0 
        ? Math.max(...results.map(f => parseDuration(f.duration))) 
        : 1200;

       setFilters({
         stops: 'all',
         airlines: [],
         priceMax: maxPrice,
         departureTime: [],
         arrivalTime: [],
         originAirports: [],
         destinationAirports: [],
         durationMax: maxDur
       });

       // Update Map ONLY (Do not touch form inputs)
       setMapOrigin(nextLeg.origin);
       setMapDestination(nextLeg.destination);
       
       window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
       // Trip selection complete
       if (!user) {
         setView('login');
       } else {
         setView('booking');
         window.scrollTo({ top: 0, behavior: 'smooth' });
       }
    }
  };

  // Allow user to go back and edit a previous step from the summary
  const handleEditStep = (index: number) => {
    if (index >= 0 && index < tripSegments.length) {
       setCurrentLegIndex(index);
       const leg = tripSegments[index];
       const results = generateMockFlights(leg.origin, leg.destination, leg.date);
       setFlights(results);
       
       // Reset filters
       const maxPrice = Math.max(...results.map(f => f.price), 5000);
       const maxDur = results.length > 0 
        ? Math.max(...results.map(f => parseDuration(f.duration))) 
        : 1200;

       setFilters({
         stops: 'all',
         airlines: [],
         priceMax: maxPrice,
         departureTime: [],
         arrivalTime: [],
         originAirports: [],
         destinationAirports: [],
         durationMax: maxDur
       });
       
       // Update Map to the leg being edited
       setMapOrigin(leg.origin);
       setMapDestination(leg.destination);
       
       window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    
    if (loggedInUser.role === 'admin') {
      setView('admin-dashboard');
    } else if (selectedFlights.length === tripSegments.length && tripSegments.length > 0) {
      // If we have completed selection
      setView('booking');
    } else {
      setView('home');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedFlights([]);
    setView('home');
    setFlights([]);
    setIsUserMenuOpen(false);
  };

  const handleAvatarClick = () => {
    if (!user) {
      setView('login');
    } else {
      setIsUserMenuOpen(!isUserMenuOpen);
    }
  };

  const handleBookingConfirm = async (details: BookingDetails) => {
    if (selectedFlights.length > 0) {
      setLoadingGuide(true);
      
      const totalPrice = selectedFlights.reduce((sum, f) => sum + f.price, 0);
      
      // Create new booking record
      const newBooking: ConfirmedBooking = {
        ...details,
        id: `ORD-${Math.floor(Math.random() * 1000000)}`,
        flight: selectedFlights[0], // Primary flight info for simple display
        flights: selectedFlights,   // Store all flights
        status: 'confirmed',
        bookingDate: new Date().toISOString(),
        totalPrice: totalPrice
      };
      
      setUserBookings(prev => [newBooking, ...prev]);
      
      setView('confirmation');
      
      // Generate guide for the final destination of the trip
      const finalDestCode = selectedFlights[selectedFlights.length - 1].destination;
      const destName = POPULAR_AIRPORTS.find(a => a.code === finalDestCode)?.city || finalDestCode;
      
      const guide = await getDestinationGuide(destName);
      setAiGuide(guide);
      setLoadingGuide(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAiRecommendation = (rec: AIRecommendation) => {
    setIsAiModalOpen(false);
    // Update both Form and Map
    handleFormDestinationChange(rec.airportCode); 
    
    setSearchParams(prev => {
        // Just update the first segment destination for simple AI flow
        const newSegments = [...prev.segments];
        if (newSegments.length > 0) {
            newSegments[0].destination = rec.airportCode;
        }
        return { ...prev, segments: newSegments };
    });
  };

  // Filter Logic
  const filteredFlights = useMemo(() => {
    return flights.filter(flight => {
       // 1. Price
       if (flight.price > filters.priceMax) return false;
       
       // 2. Stops
       if (filters.stops === 'direct' && flight.stops > 0) return false;
       if (filters.stops === '1stop' && flight.stops !== 1) return false;

       // 3. Airlines
       if (filters.airlines.length > 0 && !filters.airlines.includes(flight.airlineCode)) return false;

       // 4. Departure Time
       if (filters.departureTime.length > 0) {
          const hour = new Date(flight.departureTime).getHours();
          const match = filters.departureTime.some(period => {
             if (period === 'morning') return hour >= 6 && hour < 12;
             if (period === 'afternoon') return hour >= 12 && hour < 18;
             if (period === 'evening') return hour >= 18 && hour < 24;
             if (period === 'night') return hour >= 0 && hour < 6;
             return false;
          });
          if (!match) return false;
       }

       // 5. Arrival Time
       if (filters.arrivalTime.length > 0) {
          const hour = new Date(flight.arrivalTime).getHours();
          const match = filters.arrivalTime.some(period => {
             if (period === 'morning') return hour >= 6 && hour < 12;
             if (period === 'afternoon') return hour >= 12 && hour < 18;
             if (period === 'evening') return hour >= 18 && hour < 24;
             if (period === 'night') return hour >= 0 && hour < 6;
             return false;
          });
          if (!match) return false;
       }

       // 6. Origin Airport
       if (filters.originAirports.length > 0 && !filters.originAirports.includes(flight.origin)) return false;

       // 7. Destination Airport
       if (filters.destinationAirports.length > 0 && !filters.destinationAirports.includes(flight.destination)) return false;

       // 8. Duration
       if (parseDuration(flight.duration) > filters.durationMax) return false;

       return true;
    });
  }, [flights, filters]);

  if (view === 'admin-dashboard' && user?.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  const handleLoginCancel = () => {
    if (flights.length > 0) {
      setView('results');
    } else {
      setView('home');
    }
  };

  // Helper to generate map data based on origin and destination
  // UPGRADE: Support city name fallback
  const getRouteMapData = (originInput: string, destInput: string) => {
    // Try to find by code first, then by city name
    const findAirport = (val: string) => {
       let airport = POPULAR_AIRPORTS.find(a => a.code === val);
       if (!airport) {
          airport = POPULAR_AIRPORTS.find(a => a.city === val);
       }
       return airport;
    };

    const origin = findAirport(originInput);
    const dest = findAirport(destInput);

    if (!origin || !dest) return { points: [], routes: [] };

    const points: MapPoint[] = [
      { id: origin.code, name: origin.name, lat: origin.lat, lng: origin.lng, type: 'origin', value: 100, info: '出发地' },
      { id: dest.code, name: dest.name, lat: dest.lat, lng: dest.lng, type: 'destination', value: 100, info: '目的地' }
    ];

    const routes = [{ from: origin.code, to: dest.code }];
    return { points, routes };
  };

  // Helper to get city name for display in overlay
  const getCityName = (input: string) => {
      const airport = POPULAR_AIRPORTS.find(a => a.code === input);
      if (airport) return airport.city;
      // If input is already a city name (matches one of our airports' city), return it
      const cityMatch = POPULAR_AIRPORTS.find(a => a.city === input);
      if (cityMatch) return cityMatch.city;
      return input;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      {/* Navbar */}
      <nav className={`backdrop-blur-md border-b sticky top-0 z-40 transition-all duration-300 ${view === 'results' ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/90 border-gray-200 text-slate-800'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => setView('home')}
            >
              <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                <Plane className="w-5 h-5" />
              </div>
              <span className={`font-bold text-xl tracking-tight ${view === 'results' ? 'text-white' : 'text-gray-900'}`}>SkyLink AI</span>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <button 
                  onClick={() => setIsAiModalOpen(true)}
                  className={`hidden md:flex items-center gap-1 font-medium px-3 py-1.5 rounded-lg transition-colors ${view === 'results' ? 'text-purple-300 hover:bg-white/10' : 'text-purple-600 hover:bg-purple-50'}`}
                >
                  <Sparkles className="w-4 h-4" /> AI 助手
                </button>
              )}
              
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={handleAvatarClick}
                  className="group flex items-center gap-2 focus:outline-none"
                  title={user ? "用户菜单" : "点击登录"}
                >
                  <div className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center ${
                      view === 'results' ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-gray-100 group-hover:border-blue-400'
                    } ${user ? 'border-blue-400' : ''}`}>
                    {user ? (
                      <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className={`w-5 h-5 ${view === 'results' ? 'text-slate-400' : 'text-gray-400'} group-hover:text-blue-500`} />
                    )}
                  </div>
                  {user ? (
                     <span className={`text-sm font-medium hidden sm:block ${view === 'results' ? 'text-gray-200' : 'text-gray-700'}`}>{user.username}</span>
                  ) : (
                     <span className={`text-sm font-medium group-hover:text-blue-600 hidden sm:block ${view === 'results' ? 'text-gray-400' : 'text-gray-500'}`}>登录</span>
                  )}
                </button>

                {/* User Menu Popover */}
                {isUserMenuOpen && user && (
                  <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                      <p className="font-bold text-gray-800 truncate">{user.username}</p>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        user.role === 'admin' 
                          ? 'bg-purple-50 text-purple-600 border-purple-100' 
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {user.role === 'admin' ? 'Administrator' : 'Verified User'}
                      </span>
                    </div>
                    
                    <div className="p-2 space-y-1">
                      {user.role === 'admin' ? (
                        <button 
                          onClick={() => { setView('admin-dashboard'); setIsUserMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600 rounded-xl transition-colors text-left"
                        >
                          <LayoutDashboard className="w-4 h-4" /> 管理后台
                        </button>
                      ) : (
                        <button 
                          onClick={() => { setView('my-bookings'); setIsUserMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-colors text-left"
                        >
                          <Ticket className="w-4 h-4" /> 我的订单
                        </button>
                      )}
                      
                      <button 
                        onClick={() => { setView('profile'); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-colors text-left"
                      >
                        <UserCog className="w-4 h-4" /> 个人信息管理
                      </button>

                      <button 
                        onClick={() => { setView('settings'); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-colors text-left"
                      >
                        <Settings className="w-4 h-4" /> 账户设置
                      </button>
                    </div>

                    <div className="p-2 border-t border-gray-100 bg-gray-50/30">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" /> 退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Hero Background for Home and Login */}
        {(view === 'home' || view === 'login') && (
          <div 
            className="h-[500px] bg-cover bg-center relative flex items-center justify-center transition-all duration-700"
            style={{ backgroundImage: getBgImage() }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 text-center text-white -mt-20 px-4">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                {view === 'login' ? '开启您的专属旅程' : '探索世界，智享旅程'}
              </h1>
              <p className="text-lg md:text-xl opacity-90 font-light">
                {view === 'login' ? '请登录以继续预订' : 'AI 驱动的智能航班搜索平台'}
              </p>
            </div>
          </div>
        )}

        {/* Results Page Map Banner */}
        {view === 'results' && (
          <div className="w-full h-[640px] bg-gradient-to-br from-slate-900 via-[#0f172a] to-indigo-950 relative overflow-hidden border-b border-gray-800 shadow-inner group">
             {/* Subtle Glows */}
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent pointer-events-none"></div>
             
             {/* Real-time Map controlled by mapOrigin/mapDestination */}
             <WorldMap 
               points={getRouteMapData(mapOrigin, mapDestination).points} 
               routes={getRouteMapData(mapOrigin, mapDestination).routes} 
               className="h-full w-full rounded-none border-none opacity-100"
               showGrid={true}
               theme="dark"
             />

             {/* Dynamic Flight Path Info Overlay */}
             <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-800/80 backdrop-blur-md px-6 py-3 rounded-full border border-slate-600 shadow-2xl flex items-center gap-8 animate-fade-in-down z-10 pointer-events-none">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-blue-400 font-mono tracking-wider">出发地</span>
                  <span className="font-bold text-2xl text-white tracking-tight">
                    {POPULAR_AIRPORTS.find(a => a.code === mapOrigin)?.code || '...'}
                  </span>
                  <span className="text-xs text-gray-400">{getCityName(mapOrigin)}</span>
                </div>
                
                <div className="flex items-center text-blue-500 relative">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse absolute -left-1"></div>
                  <div className="w-32 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500 to-blue-500/10"></div>
                  <Plane className="w-5 h-5 absolute left-1/2 -translate-x-1/2 text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse absolute -right-1"></div>
                </div>

                <div className="flex flex-col items-start">
                   <span className="text-xs text-emerald-400 font-mono tracking-wider">目的地</span>
                   <span className="font-bold text-2xl text-white tracking-tight">
                     {POPULAR_AIRPORTS.find(a => a.code === mapDestination)?.code || '...'}
                   </span>
                   <span className="text-xs text-gray-400">{getCityName(mapDestination)}</span>
                </div>
             </div>
          </div>
        )}

        {/* Content Container */}
        <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 ${view !== 'home' && view !== 'login' ? '' : 'pt-8'}`}>
          
          {/* Login View */}
          {view === 'login' && (
             <div className="-mt-32 relative z-20">
               <LoginForm onLogin={handleLogin} onCancel={handleLoginCancel} />
             </div>
          )}

          {/* Search Form */}
          {(view === 'home' || view === 'results') && (
            <SearchForm 
              onSearch={handleSearch} 
              onAiRequest={() => user ? setIsAiModalOpen(true) : setView('login')}
              isAiLoading={false}
              initialValues={searchParams}
              origin={formOrigin}
              setOrigin={handleFormOriginChange}
              destination={formDestination}
              setDestination={handleFormDestinationChange}
              compact={view === 'results'}
            />
          )}

          {/* Results View */}
          {view === 'results' && (
            <div className="mt-8 animate-fade-in-up">
              
              <TripSummary 
                 segments={tripSegments}
                 selectedFlights={selectedFlights}
                 currentLegIndex={currentLegIndex}
                 onEditStep={handleEditStep}
              />

              {/* Main Layout Grid */}
              <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
                
                {/* Mobile Filter Toggle */}
                <div className="lg:hidden mb-2">
                  <button 
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="w-full flex items-center justify-center gap-2 bg-white p-3 rounded-xl shadow-sm border border-gray-200 text-blue-600 font-bold"
                  >
                    <Filter className="w-4 h-4" /> {showMobileFilters ? '隐藏筛选' : '显示筛选'}
                  </button>
                </div>

                {/* Filter Sidebar (Left Column) */}
                <div className={`lg:col-span-1 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
                  <FilterSidebar 
                    flights={flights} 
                    filters={filters} 
                    onFilterChange={setFilters} 
                  />
                </div>

                {/* Flight List (Right Column) */}
                <div className="lg:col-span-3">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <span className="bg-blue-600 w-1 h-5 rounded-full inline-block"></span>
                      可选航班 ({getCityName(mapOrigin)} → {getCityName(mapDestination)})
                    </h2>
                    <span className="text-gray-500 text-sm font-medium bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                       {filteredFlights.length} / {flights.length} 结果
                    </span>
                  </div>
                  
                  <FlightList flights={filteredFlights} onSelect={handleFlightSelect} />
                </div>
              </div>
            </div>
          )}

          {/* Booking View */}
          {view === 'booking' && selectedFlights.length > 0 && user && (
            <div className="mt-8 animate-fade-in-up space-y-6">
              <button 
                onClick={() => setView('results')}
                className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium transition-colors"
              >
                 <MoveRight className="w-4 h-4 rotate-180" /> 返回搜索结果
              </button>

              <BookingForm 
                flights={selectedFlights} 
                onConfirm={handleBookingConfirm} 
                onCancel={() => setView('results')} 
              />
            </div>
          )}
          
          {/* User Bookings View */}
          {view === 'my-bookings' && user && (
            <UserBookings bookings={userBookings} onBack={() => setView('home')} />
          )}

          {/* User Profile View */}
          {view === 'profile' && user && (
            <UserProfile user={user} onBack={() => setView('home')} />
          )}

          {/* User Settings View */}
          {view === 'settings' && user && (
            <UserSettings onBack={() => setView('home')} />
          )}

          {/* Confirmation View */}
          {view === 'confirmation' && selectedFlights.length > 0 && user && (
            <div className="mt-10 max-w-3xl mx-auto animate-fade-in-up">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100">
                <div className="bg-green-50 p-8 text-center border-b border-green-100">
                  <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-green-800 mb-2">预订成功！</h2>
                  <p className="text-green-700">您的 {selectedFlights.length} 段航班行程已确认。</p>
                  <p className="text-sm text-green-600 mt-2">乘客: {user.username} (示例)</p>
                  
                  <button 
                    onClick={() => setView('my-bookings')}
                    className="mt-4 text-green-700 underline text-sm hover:text-green-900"
                  >
                    查看我的订单
                  </button>
                </div>

                <div className="p-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" /> 
                    AI 目的地指南: {POPULAR_AIRPORTS.find(a => a.code === selectedFlights[selectedFlights.length - 1].destination)?.city}
                  </h3>
                  
                  {loadingGuide ? (
                    <div className="flex items-center justify-center py-10 gap-3 text-purple-600">
                       <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                       <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                       <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                       <span className="ml-2 text-sm font-medium">正在生成专属旅行攻略...</span>
                    </div>
                  ) : (
                    <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                      <div 
                        className="prose prose-purple prose-sm max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{ __html: aiGuide }}
                      />
                      <div className="mt-4 flex items-center gap-2 text-xs text-purple-500 font-medium bg-white/50 p-2 rounded inline-flex">
                        <MapIcon className="w-3 h-3" /> 由 Gemini 提供实时建议
                      </div>
                    </div>
                  )}

                  <div className="mt-8 text-center">
                    <button 
                      onClick={() => setView('home')}
                      className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
                    >
                      返回首页
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-8 mt-auto transition-colors ${view === 'results' ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-gray-200 text-gray-400'}`}>
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p>© 2024 SkyLink AI. Powered by Google Gemini.</p>
        </div>
      </footer>

      <AiAssistantModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        onSelectRecommendation={handleAiRecommendation}
      />
    </div>
  );
};

export default App;
