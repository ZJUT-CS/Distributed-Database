
import React, { useState } from 'react';
import { FilterState } from '../../types';
import { SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Check } from 'lucide-react';
import { AIRLINES, POPULAR_AIRPORTS } from '../../constants';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

// Collapsible Section Helper
const FilterSection = ({ 
  title, 
  children, 
  isOpenDefault = true 
}: { 
  title: string; 
  children: React.ReactNode; 
  isOpenDefault?: boolean; 
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  return (
    <div className="border-b border-gray-100 last:border-0 py-5">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center group mb-4"
      >
        <span className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{title}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, onFilterChange }) => {
  
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleArrayToggle = (key: 'airlines' | 'departureTime' | 'arrivalTime' | 'originAirports' | 'destinationAirports', value: string) => {
    const current = filters[key] as string[];
    const newValues = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, newValues);
  };

  const handleReset = () => {
    onFilterChange({
      stops: 'all',
      airlines: [],
      priceMax: 10000,
      departureTime: [],
      arrivalTime: [],
      originAirports: [],
      destinationAirports: [],
      durationMax: 1440
    });
  };

  const hasActiveFilters = 
    filters.stops !== 'all' || 
    filters.airlines.length > 0 || 
    filters.priceMax < 10000 || 
    filters.departureTime.length > 0 ||
    filters.originAirports.length > 0 ||
    filters.destinationAirports.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-800 font-bold">
          <SlidersHorizontal className="w-4 h-4" />
          <span>筛选航班</span>
        </div>
        {hasActiveFilters && (
          <button 
            onClick={handleReset}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> 重置
          </button>
        )}
      </div>

      <div className="px-5 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
        
        {/* Stops */}
        <FilterSection title="转机次数">
          <div className="space-y-2">
            {[
              { id: 'all', label: '不限' },
              { id: 'direct', label: '直飞' },
              { id: '1stop', label: '1次转机' }
            ].map((opt) => (
              <label key={opt.id} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${filters.stops === opt.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                  {filters.stops === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <input
                  type="radio"
                  name="stops"
                  className="hidden"
                  checked={filters.stops === opt.id}
                  onChange={() => updateFilter('stops', opt.id)}
                />
                <span className={`text-sm ${filters.stops === opt.id ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{opt.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Departure Time */}
        <FilterSection title="起飞时段">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'morning', label: '上午', sub: '06:00-12:00' },
              { id: 'afternoon', label: '下午', sub: '12:00-18:00' },
              { id: 'evening', label: '晚上', sub: '18:00-24:00' },
              { id: 'night', label: '凌晨', sub: '00:00-06:00' }
            ].map((t) => {
              const active = filters.departureTime.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => handleArrayToggle('departureTime', t.id)}
                  className={`p-2 rounded-xl border text-left transition-all ${active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                >
                  <div className="text-sm font-bold">{t.label}</div>
                  <div className="text-[10px] opacity-70">{t.sub}</div>
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Airlines */}
        <FilterSection title="航空公司">
          <div className="space-y-1">
            {AIRLINES.map((airline) => {
              const active = filters.airlines.includes(airline.code);
              return (
                <label key={airline.code} className="flex items-center justify-between cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${active ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                      {active && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={active}
                      onChange={() => handleArrayToggle('airlines', airline.code)}
                    />
                    <span className={`text-sm ${active ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{airline.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">¥850+</span>
                </label>
              );
            })}
          </div>
        </FilterSection>

        {/* Airports - Dynamic based on popular airports for now, ideally strictly from search results */}
        <FilterSection title="出发/到达机场" isOpenDefault={false}>
             <div className="mb-4">
                 <div className="text-xs font-bold text-gray-500 uppercase mb-2">出发机场</div>
                 <div className="space-y-1">
                     {POPULAR_AIRPORTS.slice(0, 4).map(a => (
                         <label key={`dep-${a.code}`} className="flex items-center gap-2 cursor-pointer p-1">
                            <input type="checkbox" checked={filters.originAirports.includes(a.code)} onChange={() => handleArrayToggle('originAirports', a.code)} className="rounded text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm text-gray-600">{a.name}</span>
                         </label>
                     ))}
                 </div>
             </div>
             <div>
                 <div className="text-xs font-bold text-gray-500 uppercase mb-2">到达机场</div>
                 <div className="space-y-1">
                     {POPULAR_AIRPORTS.slice(0, 4).map(a => (
                         <label key={`arr-${a.code}`} className="flex items-center gap-2 cursor-pointer p-1">
                            <input type="checkbox" checked={filters.destinationAirports.includes(a.code)} onChange={() => handleArrayToggle('destinationAirports', a.code)} className="rounded text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm text-gray-600">{a.name}</span>
                         </label>
                     ))}
                 </div>
             </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="价格区间">
          <div className="px-2 pb-2">
            <div className="flex justify-between text-sm font-bold text-gray-800 mb-4">
              <span>¥0</span>
              <span className="text-blue-600">¥{filters.priceMax.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10000"
              step="100"
              value={filters.priceMax}
              onChange={(e) => updateFilter('priceMax', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </FilterSection>

      </div>
    </div>
  );
};

export default FilterSidebar;
