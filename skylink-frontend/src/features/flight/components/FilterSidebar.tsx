import React, { useState } from 'react';
import type { FilterState } from '../types';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  Route,
  PlaneTakeoff,
  Building2,
  MapPin,
  Tag,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  ArrowRight,
  Shuffle,
  Clock3
} from 'lucide-react';
import { AIRLINES } from '@/config/data/airlines';
import { POPULAR_AIRPORTS } from '@/config/data/airports';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const FilterSection = ({
  title,
  icon,
  children,
  isOpenDefault = true
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isOpenDefault?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0 py-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center group mb-4"
      >
        <span className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
          {icon ? <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">{icon}</span> : null}
          <span>{title}</span>
        </span>
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
    filters.destinationAirports.length > 0 ||
    filters.durationMax < 1440;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden sticky top-24">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100 font-bold">
          <SlidersHorizontal className="w-4 h-4" />
          <span>筛选航班</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> 重置
          </button>
        )}
      </div>

      <div className="px-5 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">

        <FilterSection title="转机次数" icon={<Route className="w-4 h-4" />}>
          <div className="flex gap-2">
            {[
              { id: 'all', label: '不限', desc: '不限定转机', icon: Route },
              { id: 'direct', label: '直飞', desc: '无经停', icon: ArrowRight },
              { id: '1stop', label: '1 次转机', desc: '最多 1 次', icon: Shuffle }
            ].map((opt) => {
              const active = filters.stops === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateFilter('stops', opt.id as FilterState['stops'])}
                  className={`flex-1 min-w-[0] px-3 py-2.5 rounded-2xl border text-left text-xs transition-all ${active
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm shadow-blue-500/10'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <opt.icon
                      className={`w-3.5 h-3.5 ${active ? 'text-blue-600' : 'text-gray-400'
                        }`}
                    />
                    <span className="font-bold">{opt.label}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection title="起飞时段" icon={<PlaneTakeoff className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'morning', label: '上午', sub: '06:00-12:00', icon: Sunrise },
              { id: 'afternoon', label: '下午', sub: '12:00-18:00', icon: Sun },
              { id: 'evening', label: '晚上', sub: '18:00-24:00', icon: Sunset },
              { id: 'night', label: '凌晨', sub: '00:00-06:00', icon: Moon }
            ].map((t) => {
              const active = filters.departureTime.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => handleArrayToggle('departureTime', t.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${active ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm shadow-blue-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <div className="text-sm font-bold flex items-center gap-2">
                    <t.icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                    {t.label}
                  </div>
                  <div className="text-[10px] opacity-70">{t.sub}</div>
                </button>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection title="价格区间" icon={<Tag className="w-4 h-4" />}>
          <div className="px-2 pb-2">
            <div className="flex justify-between text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">
              <span>¥0</span>
              <span className="text-blue-600 dark:text-blue-400">¥{filters.priceMax.toLocaleString()}</span>
            </div>
            <div className="mx-auto w-[92%]">
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={filters.priceMax}
                onChange={(e) => updateFilter('priceMax', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
              />
            </div>
          </div>
        </FilterSection>

        <FilterSection title="飞行时长" icon={<Clock3 className="w-4 h-4" />}>
          <div className="px-2 pb-2">
            <div className="flex justify-between items-center text-xs mb-3">
              <span className="text-gray-500">≤ 飞行总时长</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {Math.floor(filters.durationMax / 60)} 小时 {filters.durationMax % 60} 分
              </span>
            </div>
            <div className="mx-auto w-[92%]">
              <input
                type="range"
                min={60}
                max={1440}
                step={15}
                value={filters.durationMax}
                onChange={(e) => updateFilter('durationMax', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 dark:accent-purple-400"
              />
            </div>
          </div>
        </FilterSection>

        <FilterSection title="出发/到达机场" icon={<MapPin className="w-4 h-4" />}>
          <div className="mb-4">
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">出发机场</div>
            <div className="space-y-1">
              {POPULAR_AIRPORTS.slice(0, 4).map(a => (
                <label key={`dep-${a.code}`} className="flex items-center justify-between gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${filters.originAirports.includes(a.code) ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}>
                      {filters.originAirports.includes(a.code) && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <input type="checkbox" checked={filters.originAirports.includes(a.code)} onChange={() => handleArrayToggle('originAirports', a.code)} className="hidden" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">{a.name}</span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{a.code}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">到达机场</div>
            <div className="space-y-1">
              {POPULAR_AIRPORTS.slice(0, 4).map(a => (
                <label key={`arr-${a.code}`} className="flex items-center justify-between gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${filters.destinationAirports.includes(a.code) ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}>
                      {filters.destinationAirports.includes(a.code) && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <input type="checkbox" checked={filters.destinationAirports.includes(a.code)} onChange={() => handleArrayToggle('destinationAirports', a.code)} className="hidden" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">{a.name}</span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{a.code}</span>
                </label>
              ))}
            </div>
          </div>
        </FilterSection>

        <FilterSection title="航空公司" icon={<Building2 className="w-4 h-4" />}>
          <div className="space-y-1">
            {AIRLINES.map((airline) => {
              const active = filters.airlines.includes(airline.code);
              return (
                <label key={airline.code} className="flex items-center justify-between cursor-pointer group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold border ${active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700'}`}>
                      {airline.code}
                    </div>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${active ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}>
                      {active && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={active}
                      onChange={() => handleArrayToggle('airlines', airline.code)}
                    />
                    <span className={`text-sm ${active ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{airline.name}</span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">¥850+</span>
                </label>
              );
            })}
          </div>
        </FilterSection>

      </div>
    </div>
  );
};

export default FilterSidebar;
