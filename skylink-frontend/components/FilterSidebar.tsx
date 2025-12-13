
import React from 'react';
import { Flight, FilterState } from '../types';
import { SlidersHorizontal, Sun, Moon, Sunrise, Sunset, Check, Clock, PlaneTakeoff, PlaneLanding } from 'lucide-react';
import { POPULAR_AIRPORTS } from '../constants';

interface FilterSidebarProps {
  flights: Flight[];
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ flights, filters, onFilterChange }) => {
  
  // Helper to parse duration string "X小时 Y分" to minutes
  const parseDuration = (dur: string): number => {
    const hMatch = dur.match(/(\d+)小时/);
    const mMatch = dur.match(/(\d+)分/);
    const h = hMatch ? parseInt(hMatch[1]) : 0;
    const m = mMatch ? parseInt(mMatch[1]) : 0;
    return h * 60 + m;
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}小时${m > 0 ? ` ${m}分` : ''}`;
  };

  // --- Data Extraction ---

  // 1. Airlines
  const availableAirlines = Array.from(new Set(flights.map(f => JSON.stringify({ code: f.airlineCode, name: f.airline }))))
    .map((s) => JSON.parse(s as string) as { code: string; name: string });

  // 2. Prices
  const maxPrice = flights.length > 0 ? Math.max(...flights.map(f => f.price)) : 5000;
  const minPrice = flights.length > 0 ? Math.min(...flights.map(f => f.price)) : 0;

  // 3. Durations
  const durations = flights.map(f => parseDuration(f.duration));
  const maxDur = durations.length > 0 ? Math.max(...durations) : 1200; // default 20h
  const minDur = durations.length > 0 ? Math.min(...durations) : 0;

  // 4. Airports
  const uniqueOrigins = Array.from(new Set(flights.map(f => f.origin))).map(code => {
    const airport = POPULAR_AIRPORTS.find(a => a.code === code);
    return { code, name: airport?.name || code, city: airport?.city || '' };
  });
  
  const uniqueDestinations = Array.from(new Set(flights.map(f => f.destination))).map(code => {
    const airport = POPULAR_AIRPORTS.find(a => a.code === code);
    return { code, name: airport?.name || code, city: airport?.city || '' };
  });

  // --- Handlers ---

  const handleAirlineToggle = (code: string) => {
    const newAirlines = filters.airlines.includes(code)
      ? filters.airlines.filter(c => c !== code)
      : [...filters.airlines, code];
    onFilterChange({ ...filters, airlines: newAirlines });
  };

  const handleAirportToggle = (type: 'originAirports' | 'destinationAirports', code: string) => {
    const current = filters[type];
    const updated = current.includes(code)
      ? current.filter(c => c !== code)
      : [...current, code];
    onFilterChange({ ...filters, [type]: updated });
  };

  const handleTimeToggle = (type: 'departureTime' | 'arrivalTime', periodId: string) => {
    const current = filters[type];
    const updated = current.includes(periodId)
      ? current.filter(p => p !== periodId)
      : [...current, periodId];
    onFilterChange({ ...filters, [type]: updated });
  };

  const resetFilters = () => {
    onFilterChange({
      stops: 'all',
      airlines: [],
      priceMax: maxPrice,
      durationMax: maxDur,
      departureTime: [],
      arrivalTime: [],
      originAirports: [],
      destinationAirports: []
    });
  };

  // Time periods configuration
  const timePeriods = [
    { id: 'morning', label: '上午', time: '06:00-12:00', icon: Sun },
    { id: 'afternoon', label: '下午', time: '12:00-18:00', icon: Sunset },
    { id: 'evening', label: '晚上', time: '18:00-24:00', icon: Moon },
    { id: 'night', label: '凌晨', time: '00:00-06:00', icon: Sunrise },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-8 h-fit sticky top-24 animate-in fade-in slide-in-from-left-4 duration-500 overflow-y-auto max-h-[85vh] custom-scrollbar">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
        <SlidersHorizontal className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-gray-800">航班筛选</h3>
        <button 
           onClick={resetFilters}
           className="ml-auto text-xs text-blue-600 hover:underline font-medium"
        >
          重置全部
        </button>
      </div>

      {/* 1. Stops */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-700">转机次数</h4>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'all', label: '不限' },
            { id: 'direct', label: '直飞' },
            { id: '1stop', label: '1次转机' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => onFilterChange({ ...filters, stops: opt.id as any })}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                filters.stops === opt.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Price Range */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
           <h4 className="text-sm font-bold text-gray-700">价格区间</h4>
           <span className="text-xs font-medium text-orange-600">¥{minPrice} - ¥{filters.priceMax}</span>
        </div>
        <div className="relative pt-1">
          {/* Fixed type error by explicit typing of event */}
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            step={100}
            value={filters.priceMax}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFilterChange({ ...filters, priceMax: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* 3. Duration Range (NEW) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
           <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
             <Clock className="w-3.5 h-3.5 text-gray-400" /> 飞行时长
           </h4>
           <span className="text-xs font-medium text-gray-600">≤ {formatDuration(filters.durationMax)}</span>
        </div>
        <div className="relative pt-1">
          {/* Fixed type error by explicit typing of event */}
          <input
            type="range"
            min={minDur}
            max={maxDur}
            step={30}
            value={filters.durationMax}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFilterChange({ ...filters, durationMax: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>
      </div>

      {/* 4. Origin Airport (NEW) */}
      {uniqueOrigins.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <PlaneTakeoff className="w-3.5 h-3.5 text-gray-400" /> 出发机场
          </h4>
          <div className="space-y-2">
            {uniqueOrigins.map((airport) => (
              <label key={airport.code} className="flex items-center gap-2 cursor-pointer group hover:bg-gray-50 p-1.5 -mx-1.5 rounded-lg transition-colors">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                  filters.originAirports.includes(airport.code) 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'border-gray-300 group-hover:border-blue-400'
                }`}>
                  {filters.originAirports.includes(airport.code) && <Check className="w-3 h-3 text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={filters.originAirports.includes(airport.code)}
                  onChange={() => handleAirportToggle('originAirports', airport.code)}
                />
                <span className={`text-xs ${filters.originAirports.includes(airport.code) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                   {airport.city} {airport.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 5. Destination Airport (NEW) */}
      {uniqueDestinations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <PlaneLanding className="w-3.5 h-3.5 text-gray-400" /> 抵达机场
          </h4>
          <div className="space-y-2">
            {uniqueDestinations.map((airport) => (
              <label key={airport.code} className="flex items-center gap-2 cursor-pointer group hover:bg-gray-50 p-1.5 -mx-1.5 rounded-lg transition-colors">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                  filters.destinationAirports.includes(airport.code) 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'border-gray-300 group-hover:border-blue-400'
                }`}>
                  {filters.destinationAirports.includes(airport.code) && <Check className="w-3 h-3 text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={filters.destinationAirports.includes(airport.code)}
                  onChange={() => handleAirportToggle('destinationAirports', airport.code)}
                />
                <span className={`text-xs ${filters.destinationAirports.includes(airport.code) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                   {airport.city} {airport.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 6. Departure Time */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-700">出发时间</h4>
        <div className="grid grid-cols-2 gap-2">
          {timePeriods.map((period) => {
            const Icon = period.icon;
            const isSelected = filters.departureTime.includes(period.id);
            return (
              <button
                key={period.id}
                onClick={() => handleTimeToggle('departureTime', period.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  isSelected 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium">{period.label}</span>
                </div>
                <span className="text-[10px] opacity-70 font-mono">{period.time}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. Arrival Time */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-700">抵达时间</h4>
        <div className="grid grid-cols-2 gap-2">
          {timePeriods.map((period) => {
            const Icon = period.icon;
            const isSelected = filters.arrivalTime.includes(period.id);
            return (
              <button
                key={period.id}
                onClick={() => handleTimeToggle('arrivalTime', period.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  isSelected 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium">{period.label}</span>
                </div>
                <span className="text-[10px] opacity-70 font-mono">{period.time}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 8. Airlines */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-700">航空公司</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
          {availableAirlines.map((airline) => (
            <label key={airline.code} className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-1 rounded-lg transition-colors">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                filters.airlines.includes(airline.code) 
                  ? 'bg-blue-600 border-blue-600' 
                  : 'border-gray-300 group-hover:border-blue-400'
              }`}>
                {filters.airlines.includes(airline.code) && <Check className="w-3 h-3 text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={filters.airlines.includes(airline.code)}
                onChange={() => handleAirlineToggle(airline.code)}
              />
              <span className={`text-xs ${filters.airlines.includes(airline.code) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                {airline.name}
              </span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
};

export default FilterSidebar;
