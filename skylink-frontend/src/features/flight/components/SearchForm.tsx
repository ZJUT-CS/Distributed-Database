import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, ChevronDown, Minus, Plus, ChevronRight, ChevronLeft, ArrowRightLeft, X, MapPin, Building2, Plane, Sparkles } from 'lucide-react';
import { POPULAR_AIRPORTS } from '@/config/data/airports';
import type { SearchParams } from '../types';
import Loading from '@/components/common/Loading';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  onAiRequest: () => void;
  isAiLoading: boolean;
  initialValues?: SearchParams;
  origin: string;
  setOrigin: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  compact?: boolean;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const CITY_GROUPS = {
  domestic: ['北京', '上海', '广州', '深圳', '成都', '杭州', '西安', '重庆', '香港'],
  international: ['东京', '新加坡', '曼谷', '伦敦', '纽约', '悉尼']
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatLocalYmd = (d: Date) => {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const parseYmdToLocalDate = (ymd: string) => {
  const parts = ymd.split('-');
  if (parts.length !== 3) return new Date(ymd);
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return new Date(ymd);
  return new Date(year, month - 1, day);
};

const addDaysToYmd = (ymd: string, days: number) => {
  const d = parseYmdToLocalDate(ymd);
  d.setDate(d.getDate() + days);
  return formatLocalYmd(d);
};

const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  onAiRequest,
  isAiLoading,
  initialValues,
  origin,
  setOrigin,
  destination,
  setDestination,
  compact = false
}) => {
  const [date, setDate] = useState(initialValues?.segments?.[0]?.date || formatLocalYmd(new Date()));
  const [returnDate, setReturnDate] = useState('');

  const [tripType, setTripType] = useState<'oneWay' | 'roundTrip' | 'multiCity'>('oneWay');

  const [activeCalendarId, setActiveCalendarId] = useState<string | null>(null);
  const [pickerViewDate, setPickerViewDate] = useState(new Date());
  const [activeCityPickerId, setActiveCityPickerId] = useState<string | null>(null);
  const [activeCityPickerType, setActiveCityPickerType] = useState<'origin' | 'destination' | null>(null);
  const [cityTab, setCityTab] = useState<'domestic' | 'international'>('domestic');

  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const passengerRef = useRef<HTMLDivElement>(null);
  const cityPickerRef = useRef<HTMLDivElement>(null);

  const inputHeight = compact ? 'h-[52px]' : 'h-[72px]';
  const mainTextSize = compact ? 'text-lg' : 'text-xl';
  const labelTextSize = compact ? 'text-[9px]' : 'text-[10px]';
  const labelTop = compact ? 'top-1.5' : 'top-2.5';
  const iconSize = compact ? 'w-4 h-4' : 'w-6 h-6';
  const buttonTextSize = compact ? 'text-[9px]' : 'text-[10px]';
  const containerPadding = compact ? 'p-3 lg:p-4 space-y-2' : 'p-4 lg:p-8 space-y-3';
  const headerPadding = compact ? 'px-6 pt-3 pb-1' : 'px-8 pt-6 pb-2';
  const containerRadius = compact ? 'rounded-2xl' : 'rounded-[2rem]';

  const [segments, setSegments] = useState([
    { id: generateId(), origin: '北京', destination: '上海', date: date },
    { id: generateId(), origin: '上海', destination: '广州', date: date }
  ]);

  const [adults, setAdults] = useState(initialValues?.passengerDetails?.adults || 1);
  const [children, setChildren] = useState(initialValues?.passengerDetails?.children || 0);
  const [infants, setInfants] = useState(initialValues?.passengerDetails?.infants || 0);
  const [cabinClass, setCabinClass] = useState<'economy' | 'business' | 'first'>(initialValues?.cabinClass || 'economy');
  const [isPassengerOpen, setIsPassengerOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (passengerRef.current && !passengerRef.current.contains(event.target as Node)) {
        setIsPassengerOpen(false);
      }
      if (activeCalendarId && calendarContainerRef.current && !calendarContainerRef.current.contains(event.target as Node)) {
        setActiveCalendarId(null);
      }
      if (activeCityPickerId && cityPickerRef.current && !cityPickerRef.current.contains(event.target as Node)) {
        setActiveCityPickerId(null);
        setActiveCityPickerType(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeCalendarId, activeCityPickerId]);

  useEffect(() => {
    setSegments(prev => {
      const newSegs = [...prev];
      if (newSegs.length > 0) {
        if (newSegs[0].origin !== origin || newSegs[0].destination !== destination || newSegs[0].date !== date) {
          newSegs[0] = { ...newSegs[0], origin, destination, date };
          return newSegs;
        }
      }
      return prev;
    });
  }, [origin, destination, date]);

  const updateSegment = (id: string, field: 'origin' | 'destination' | 'date', value: string) => {
    setSegments(prev => {
      const newSegs = prev.map(s => s.id === id ? { ...s, [field]: value } : s);

      if (newSegs.length > 0 && newSegs[0].id === id) {
        if (field === 'origin') setOrigin(value);
        if (field === 'destination') setDestination(value);
        if (field === 'date') setDate(value);
      }
      return newSegs;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalSegments: { origin: string; destination: string; date: string }[] = [];

    if (tripType === 'oneWay') {
      finalSegments = [{
        origin: segments[0].origin,
        destination: segments[0].destination,
        date: segments[0].date
      }];
    } else if (tripType === 'roundTrip') {
      finalSegments = [
        {
          origin: segments[0].origin,
          destination: segments[0].destination,
          date: segments[0].date
        },
        {
          origin: segments[0].destination,
          destination: segments[0].origin,
          date: returnDate || (() => {
            return addDaysToYmd(segments[0].date, 3);
          })()
        }
      ];
    } else if (tripType === 'multiCity') {
      finalSegments = segments.map(s => ({
        origin: s.origin,
        destination: s.destination,
        date: s.date
      }));
    }

    onSearch({
      tripType,
      segments: finalSegments,
      passengers: adults + children + infants,
      passengerDetails: { adults, children, infants },
      cabinClass
    });
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSegmentSwap = (id: string) => {
    const seg = segments.find(s => s.id === id);
    if (seg) {
      updateSegment(id, 'origin', seg.destination);
      updateSegment(id, 'destination', seg.origin);
    }
  };

  const handleCitySelect = (city: string) => {
    if (activeCityPickerId && activeCityPickerType) {
      updateSegment(activeCityPickerId, activeCityPickerType, city);
      setActiveCityPickerId(null);
      setActiveCityPickerType(null);
    }
  };

  const handleDateSelect = (selectedDateStr: string) => {
    if (activeCalendarId) {
      if (tripType === 'roundTrip' && activeCalendarId === segments[0].id) {
        if (!date && !returnDate) {
          setDate(selectedDateStr);
        } else if (date && !returnDate) {
          if (selectedDateStr < date) {
            setDate(selectedDateStr);
          } else {
            setReturnDate(selectedDateStr);
            setActiveCalendarId(null);
          }
        } else if (date && returnDate) {
          setDate(selectedDateStr);
          setReturnDate('');
        }
      } else {
        updateSegment(activeCalendarId, 'date', selectedDateStr);
        setActiveCalendarId(null);
      }
    }
  };

  const isInRange = (dayStr: string) => {
    if (tripType !== 'roundTrip') return false;
    if (activeCalendarId !== segments[0].id && activeCalendarId !== null) return false;
    if (!date || !returnDate) return false;
    return dayStr > date && dayStr < returnDate;
  };

  const isSelectedDate = (dayStr: string) => {
    if (activeCalendarId) {
      if (tripType === 'roundTrip' && activeCalendarId === segments[0].id) {
        return dayStr === date || dayStr === returnDate;
      }
      const seg = segments.find(s => s.id === activeCalendarId);
      return seg ? seg.date === dayStr : false;
    }
    return false;
  };

  const renderCityPicker = () => {
    return (
      <div
        ref={cityPickerRef}
        className="absolute top-full z-50 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 w-[400px] animate-in fade-in zoom-in-95 duration-200 mt-2 left-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
          <button
            type="button"
            onClick={() => setCityTab('domestic')}
            className={`pb-2 px-2 text-sm font-bold transition-colors border-b-2 ${cityTab === 'domestic' ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            热门国内
          </button>
          <button
            type="button"
            onClick={() => setCityTab('international')}
            className={`pb-2 px-2 text-sm font-bold transition-colors border-b-2 ${cityTab === 'international' ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            热门国际
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {CITY_GROUPS[cityTab].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handleCitySelect(city)}
              className="py-2 px-1 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center truncate"
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderCalendarContent = () => {
    const renderMonth = (offset: number) => {
      const viewMonth = new Date(pickerViewDate);
      viewMonth.setMonth(viewMonth.getMonth() + offset);
      const year = viewMonth.getFullYear();
      const month = viewMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startDayOfWeek = new Date(year, month, 1).getDay();

      const days = [];
      for (let i = 0; i < startDayOfWeek; i++) days.push(<div key={`empty-${offset}-${i}`} />);
      const todayStr = formatLocalYmd(new Date());

      for (let d = 1; d <= daysInMonth; d++) {
        const currentDate = new Date(year, month, d);
        const dateStr = formatLocalYmd(currentDate);
        const isPast = dateStr < todayStr;
        const selected = isSelectedDate(dateStr);
        const inRange = isInRange(dateStr);
        const basePrice = 300 + (d % 5) * 50 + (offset * 20);
        const isCheap = basePrice < 400;

        let bgClass = '';
        let textClass = 'text-gray-700 dark:text-gray-300';

        if (selected) {
          bgClass = 'bg-blue-600 text-white rounded-full hover:bg-blue-700';
          textClass = 'text-white';
          if (tripType === 'roundTrip' && activeCalendarId === segments[0].id) {
            if (dateStr === date && returnDate) bgClass = 'bg-blue-600 text-white rounded-l-full rounded-r-none';
            if (dateStr === returnDate) bgClass = 'bg-blue-600 text-white rounded-r-full rounded-l-none';
            if (dateStr === date && !returnDate) bgClass = 'bg-blue-600 text-white rounded-full';
          }
        } else if (inRange) {
          bgClass = 'bg-blue-50 dark:bg-blue-900/30';
          textClass = 'text-blue-700 dark:text-blue-300';
        } else if (isPast) {
          textClass = 'text-gray-200 dark:text-gray-700 cursor-not-allowed';
        } else {
          bgClass = 'hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer';
        }

        days.push(
          <button
            key={dateStr}
            type="button"
            disabled={isPast}
            onClick={(e) => { e.stopPropagation(); handleDateSelect(dateStr); }}
            className={`relative h-10 w-full flex flex-col items-center justify-center text-sm font-medium transition-all ${bgClass} ${textClass}`}
          >
            <span className="z-10 relative">{d}</span>
            {!isPast && !selected && !inRange && (
              <span className={`text-[9px] scale-75 -mt-1 font-medium ${isCheap ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-300'}`}>¥{basePrice}</span>
            )}
          </button>
        );
      }

      return (
        <div className="w-full">
          <div className="text-center font-bold text-gray-800 dark:text-gray-200 mb-4 text-sm">{year}年 {month + 1}月</div>
          <div className="grid grid-cols-7 gap-y-2 text-center mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className="text-xs text-gray-400 dark:text-gray-300">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1">{days}</div>
        </div>
      );
    };

    const nextMonth = (e: React.MouseEvent) => { e.stopPropagation(); const n = new Date(pickerViewDate); n.setMonth(n.getMonth() + 1); setPickerViewDate(n); };
    const prevMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      const p = new Date(pickerViewDate);
      const today = new Date();
      today.setDate(1);
      p.setMonth(p.getMonth() - 1);
      if (p >= today || (p.getMonth() === today.getMonth() && p.getFullYear() === today.getFullYear())) setPickerViewDate(p);
    };

    return (
      <div
        ref={calendarContainerRef}
        className="absolute top-full z-50 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 w-[650px] animate-in fade-in zoom-in-95 duration-200 mt-2 left-0 md:left-auto"
        style={activeCalendarId && activeCalendarId !== segments[0].id ? { left: '0', zIndex: 60 } : { left: '50%', transform: 'translateX(-50%)', zIndex: 60 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" /></button>
          <div className="font-bold text-lg text-gray-800 dark:text-gray-200">选择日期</div>
          <button type="button" onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" /></button>
        </div>
        <div className="flex gap-8">
          <div className="flex-1 border-r border-gray-100 dark:border-gray-700 pr-4">{renderMonth(0)}</div>
          <div className="flex-1 pl-4">{renderMonth(1)}</div>
        </div>
      </div>
    );
  };

  const handleAddSegment = () => {
    if (segments.length >= 6) return;
    const lastSegment = segments[segments.length - 1];
    setSegments([...segments, { id: generateId(), origin: lastSegment.destination, destination: '北京', date: lastSegment.date }]);
  };
  const handleRemoveSegment = (id: string) => {
    if (segments.length <= 1) return;
    setSegments(segments.filter(s => s.id !== id));
  };

  const getCabinLabel = (cls: string) => {
    switch (cls) {
      case 'economy': return '经济舱';
      case 'business': return '公务舱';
      case 'first': return '头等舱';
      default: return '经济舱';
    }
  };

  const getDisplayLocation = (val: string) => {
    const airport = POPULAR_AIRPORTS.find(a => a.code === val);
    if (airport) return airport.city;
    const isCity = POPULAR_AIRPORTS.some(a => a.city === val);
    if (isCity) return val;
    return val;
  };

  const getSubLabel = (val: string) => {
    const airport = POPULAR_AIRPORTS.find(a => a.code === val);
    if (airport) return airport.code;
    return "所有机场";
  };

  const rowsToRender = tripType === 'multiCity' ? segments : [segments[0]];

  return (
    <div className={`-mt-24 relative z-30 w-full`}>
      <div className={`bg-white/95 dark:bg-gray-900/95 ${containerRadius} shadow-2xl border border-white/60 dark:border-gray-700/60 backdrop-blur-xl relative overflow-visible transition-all duration-300 ease-in-out`}>

        <div className={`${headerPadding} flex flex-col md:flex-row justify-between items-center gap-4`}>
          <div className="bg-gray-100/80 dark:bg-gray-800/80 p-1 rounded-full flex items-center shadow-inner dark:shadow-none">
            {[
              { id: 'oneWay', label: '单程' },
              { id: 'roundTrip', label: '往返' },
              { id: 'multiCity', label: '多程' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setTripType(tab.id as any);
                  if (tab.id !== 'roundTrip') {
                    setReturnDate('');
                    setActiveCalendarId(null);
                  }
                  if (tab.id !== 'multiCity' && tripType === 'multiCity') {
                    setSegments([segments[0], { id: generateId(), origin: segments[0].destination, destination: '广州', date: segments[0].date }]);
                  }
                }}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${tripType === tab.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md transform scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                  } ${compact ? 'py-1.5 px-4 text-xs' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onAiRequest}
            disabled={isAiLoading}
            className={`group relative flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-full border border-purple-100 dark:border-purple-800 transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${compact ? 'px-4 py-1.5 text-xs' : 'px-5 py-2.5'}`}
          >
            {isAiLoading ? (
              <>
                <Loading size={compact ? 'sm' : 'md'} color="primary" />
                <span>AI 思考中...</span>
              </>
            ) : (
              <>
                <div className={`flex items-center justify-center group-hover:animate-pulse ${compact ? 'w-3 h-3' : 'w-4 h-4'}`}>
                  <Sparkles className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-purple-600`} />
                </div>
                <span>AI 灵感推荐</span>
              </>
            )}
            {isAiLoading && (
              <div className="absolute inset-0 rounded-full bg-purple-100 animate-pulse" />
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className={containerPadding}>
          {rowsToRender.map((segment, index) => {
            const isRoundTripMain = index === 0 && tripType === 'roundTrip';
            const isMultiCity = tripType === 'multiCity';

            const isRowActive = activeCityPickerId === segment.id || activeCalendarId === segment.id || (index === 0 && isPassengerOpen);
            const zIndexStyle = { zIndex: isRowActive ? 100 : 40 - index };

            return (
              <div
                key={segment.id}
                className={`flex gap-4 items-start transition-all duration-500 ease-in-out relative ${index > 0 ? 'animate-in slide-in-from-bottom-2 fade-in' : ''}`}
                style={{ animationDelay: `${index * 50}ms`, ...zIndexStyle }}
              >
                {isMultiCity && (
                  <div className={`hidden md:flex flex-col justify-start ${compact ? 'pt-[12px]' : 'pt-[18px]'}`}>
                    <div className={`bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center shadow-md shadow-blue-200 ${compact ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'}`}>
                      {index + 1}
                    </div>
                  </div>
                )}

                <div className="flex-1 flex flex-col lg:flex-row gap-3">
                  <div className="flex-[2] flex flex-col md:flex-row gap-2 relative z-10">

                    <div
                      onClick={(e) => { e.stopPropagation(); setActiveCityPickerId(segment.id); setActiveCityPickerType('origin'); }}
                      className={`flex-1 relative group bg-gray-50 dark:bg-gray-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/30 rounded-2xl transition-all duration-300 border cursor-pointer ${inputHeight} ${activeCityPickerId === segment.id && activeCityPickerType === 'origin' ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/50 animate-focus-border' : 'border-transparent hover:border-blue-100 dark:hover:border-blue-900'}`}
                    >
                      <div className={`absolute ${labelTop} left-5 ${labelTextSize} font-bold text-gray-400 dark:text-gray-300 uppercase tracking-wider`}>出发地</div>
                      <div className={`h-full flex items-center pl-5 pr-10 ${compact ? 'pt-1' : 'pt-3'}`}>
                        <span className={`${mainTextSize} font-bold text-gray-800 dark:text-gray-100 truncate tracking-tight`}>{getDisplayLocation(segment.origin) || '选择城市'}</span>
                      </div>
                      <div className={`absolute bottom-3 right-5 ${labelTextSize} font-mono font-medium text-gray-400 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md`}>
                        {getSubLabel(segment.origin)}
                      </div>
                      {activeCityPickerId === segment.id && activeCityPickerType === 'origin' && renderCityPicker()}
                    </div>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
                      <button type="button" onClick={(e) => { e.stopPropagation(); index === 0 ? handleSwap() : handleSegmentSwap(segment.id); }} className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-blue-600 hover:text-blue-700 hover:rotate-180 transition-all duration-300 hover:scale-110 group`}>
                        <ArrowRightLeft className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} group-hover:text-blue-700`} />
                      </button>
                    </div>

                    <div
                      onClick={(e) => { e.stopPropagation(); setActiveCityPickerId(segment.id); setActiveCityPickerType('destination'); }}
                      className={`flex-1 relative group bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/30 rounded-2xl transition-all duration-300 border cursor-pointer ${inputHeight} ${activeCityPickerId === segment.id && activeCityPickerType === 'destination' ? 'border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-900/50 animate-focus-border' : 'border-transparent hover:border-emerald-100 dark:hover:border-emerald-900'}`}
                    >
                      <div className={`absolute ${labelTop} left-5 ${labelTextSize} font-bold text-gray-400 dark:text-gray-300 uppercase tracking-wider`}>目的地</div>
                      <div className={`h-full flex items-center pl-5 pr-10 ${compact ? 'pt-1' : 'pt-3'}`}>
                        <span className={`${mainTextSize} font-bold text-gray-800 dark:text-gray-100 truncate tracking-tight`}>{getDisplayLocation(segment.destination) || '选择城市'}</span>
                      </div>
                      <div className={`absolute bottom-3 right-5 ${labelTextSize} font-mono font-medium text-gray-400 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md`}>
                        {getSubLabel(segment.destination)}
                      </div>
                      {activeCityPickerId === segment.id && activeCityPickerType === 'destination' && renderCityPicker()}
                    </div>
                  </div>

                  <div className={`relative transition-all duration-500 ease-in-out ${inputHeight} ${isRoundTripMain ? 'flex-[1.2]' : 'flex-1'}`}>
                    <button
                      type="button"
                      onClick={() => setActiveCalendarId(activeCalendarId === segment.id ? null : segment.id)}
                      className={`w-full h-full bg-gray-50 dark:bg-gray-800 rounded-2xl p-1 flex items-stretch border border-transparent hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-300 group ${activeCalendarId === segment.id ? 'border-blue-400 dark:border-blue-500 bg-blue-50/10 dark:bg-blue-900/20 animate-focus-border' : ''}`}
                    >
                      <div className={`flex-1 flex flex-col justify-center px-5 rounded-xl transition-all ${activeCalendarId === segment.id ? 'bg-white shadow-sm' : ''}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-300 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                          <span className={`${labelTextSize} font-bold text-gray-400 dark:text-gray-300 uppercase tracking-wider`}>
                            {isRoundTripMain ? '出发 - 返程' : '出发日期'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-baseline gap-1">
                            <span className={`${mainTextSize} font-bold text-gray-800 dark:text-gray-100 tracking-tight`}>
                              {parseYmdToLocalDate(segment.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                            </span>
                            {!isRoundTripMain && (
                              <span className={`${labelTextSize} text-gray-400 dark:text-gray-300 font-medium mt-1`}>
                                {parseYmdToLocalDate(segment.date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                              </span>
                            )}
                          </div>
                          {isRoundTripMain && (
                            <>
                              <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
                              {returnDate ? (
                                <div className="flex items-baseline gap-1">
                                  <span className={`${mainTextSize} font-bold text-gray-800 dark:text-gray-100 tracking-tight`}>
                                    {parseYmdToLocalDate(returnDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-300 text-sm font-medium">选择返程</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                    {activeCalendarId === segment.id && renderCalendarContent()}
                  </div>

                  <div className={`w-full lg:min-w-[300px] lg:w-[300px] ${inputHeight}`}>
                    {index === 0 ? (
                      <div className={`flex gap-3 w-full ${inputHeight}`}>
                        <div className="flex-1 relative group h-full" ref={passengerRef}>
                          <button
                            type="button"
                            onClick={() => setIsPassengerOpen(!isPassengerOpen)}
                            className={`w-full h-full bg-gray-50 dark:bg-gray-800 border border-transparent rounded-2xl text-left pl-5 pr-4 outline-none transition-all duration-300 hover:bg-purple-50/30 dark:hover:bg-purple-900/30 flex flex-col justify-center ${isPassengerOpen ? 'bg-white dark:bg-gray-800 ring-2 ring-purple-100 dark:ring-purple-900/50 border-purple-200 dark:border-purple-700 animate-focus-border' : ''}`}
                          >
                            <label className={`block ${labelTextSize} font-bold text-gray-400 dark:text-gray-300 uppercase tracking-wider mb-0.5`}>旅客 & 舱位</label>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`font-bold text-gray-800 truncate ${compact ? 'text-base' : 'text-lg'}`}>
                                  {adults + children + infants} 人
                                </span>
                                <span className={`${labelTextSize} text-gray-500 dark:text-gray-400 truncate`}>{getCabinLabel(cabinClass)}</span>
                              </div>
                              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${isPassengerOpen ? 'rotate-180' : ''}`} />
                            </div>
                          </button>
                          {isPassengerOpen && (
                            <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 p-6 animate-in fade-in slide-in-from-top-4 duration-200">
                              <div className="space-y-6">
                                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                  <h4 className="font-bold text-gray-900 text-lg">旅客选择</h4>
                                </div>
                                {[
                                  { label: '成人', sub: '12 岁及以上', val: adults, set: setAdults, min: 1 },
                                  { label: '儿童', sub: '2-11 岁', val: children, set: setChildren, min: 0 },
                                  { label: '婴儿', sub: '2 岁以下', val: infants, set: setInfants, min: 0 }
                                ].map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <div>
                                      <div className="font-bold text-gray-800">{item.label}</div>
                                      <div className="text-xs text-gray-400 dark:text-gray-300">{item.sub}</div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-full p-1">
                                      <button type="button" onClick={() => item.set(Math.max(item.min, item.val - 1))} className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50" disabled={item.val <= item.min}><Minus className="w-3.5 h-3.5" /></button>
                                      <span className="w-6 text-center font-bold text-gray-800 dark:text-gray-200 text-sm">{item.val}</span>
                                      <button type="button" onClick={() => item.set(item.val + 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 shadow-sm text-white hover:bg-blue-700"><Plus className="w-3.5 h-3.5" /></button>
                                    </div>
                                  </div>
                                ))}
                                <div className="pt-2">
                                  <div className="bg-gray-100/80 p-1 rounded-xl flex gap-1">
                                    {['economy', 'business', 'first'].map((cls) => (
                                      <button key={cls} type="button" onClick={() => setCabinClass(cls as any)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${cabinClass === cls ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'}`}>{getCabinLabel(cls)}</button>
                                    ))}
                                  </div>
                                </div>
                                <button type="button" onClick={() => setIsPassengerOpen(false)} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:shadow-lg shadow-blue-500/30 transition-all transform active:scale-95">确认</button>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          type="submit"
                          className={`w-24 h-full bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl shadow-xl shadow-blue-500/30 flex flex-col items-center justify-center transition-all transform hover:-translate-y-1 hover:shadow-2xl active:scale-95 group`}
                        >
                          <Search className={`${iconSize} mb-0.5 group-hover:scale-110 transition-transform`} />
                          <span className={`${buttonTextSize} font-bold uppercase tracking-widest opacity-90`}>搜索</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-full items-center pl-2">
                        <button type="button" onClick={() => handleRemoveSegment(segment.id)} className="group flex items-center gap-2 text-gray-400 hover:text-red-500 px-4 py-2 rounded-xl hover:bg-red-50 transition-all">
                          <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium">删除航段</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {tripType === 'multiCity' && (
            <div className="flex gap-4 pl-0 md:pl-[52px] pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <button type="button" onClick={handleAddSegment} className="flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors border border-dashed border-blue-200 hover:border-blue-400">
                <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </div>
                添加航班
              </button>
            </div>
          )}
        </form>

        {tripType !== 'multiCity' && (
          <div className="border-t border-gray-100 dark:border-white/5 bg-white/50 dark:bg-slate-900/40 rounded-b-[2rem] px-6 py-3 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <div className="flex-1 flex justify-between gap-2 overflow-x-auto scrollbar-hide">
                {[...Array(5)].map((_, i) => {
                  const dStr = addDaysToYmd(date, i - 1);
                  const d = parseYmdToLocalDate(dStr);
                  const isSelected = dStr === date;
                  const price = 180 + (d.getDate() % 5) * 50;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setDate(dStr); if (tripType === 'roundTrip' && returnDate && dStr > returnDate) setReturnDate(''); }}
                      className={`flex-1 min-w-[100px] flex flex-col items-center py-2 rounded-xl transition-all duration-300 border ${isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700/50 shadow-sm transform scale-105'
                        : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                      <div className={`text-xs font-medium mb-1 whitespace-nowrap ${isSelected ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        {d.getMonth() + 1}月{d.getDate()}日 <span className="opacity-75 hidden sm:inline">{d.toLocaleDateString('zh-CN', { weekday: 'short' })}</span>
                      </div>
                      <div className={`text-sm font-bold ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        ¥{price * 7}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SearchForm;

