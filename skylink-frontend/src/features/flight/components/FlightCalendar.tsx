import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatLocalYmd = (d: Date) => {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export interface FlightCalendarProps {
  isOpen: boolean;
  tripType: 'oneWay' | 'roundTrip' | 'multiCity';
  activeSegmentId: string | null;
  selectedDate: string;
  returnDate?: string;
  segments: Array<{ id: string; date: string }>;
  onClose: () => void;
  onSelectDate: (date: string) => void;
}

export const FlightCalendar: React.FC<FlightCalendarProps> = ({
  isOpen,
  tripType,
  activeSegmentId,
  selectedDate,
  returnDate = '',
  segments,
  onClose,
  onSelectDate,
}) => {
  const [pickerViewDate, setPickerViewDate] = useState(new Date());

  if (!isOpen) return null;

  const handleDateSelect = (selectedDateStr: string) => {
    if (tripType === 'roundTrip' && activeSegmentId === segments[0]?.id) {
      if (!selectedDate && !returnDate) {
        onSelectDate(selectedDateStr);
      } else if (selectedDate && !returnDate) {
        if (selectedDateStr < selectedDate) {
          onSelectDate(selectedDateStr);
        } else {
          onSelectDate(selectedDateStr);
          onClose();
        }
      } else if (selectedDate && returnDate) {
        onSelectDate(selectedDateStr);
      }
    } else {
      onSelectDate(selectedDateStr);
      onClose();
    }
  };

  const isInRange = (dayStr: string) => {
    if (tripType !== 'roundTrip') return false;
    if (activeSegmentId !== segments[0]?.id && activeSegmentId !== null) return false;
    if (!selectedDate || !returnDate) return false;
    return dayStr > selectedDate && dayStr < returnDate;
  };

  const isSelectedDate = (dayStr: string) => {
    if (activeSegmentId) {
      if (tripType === 'roundTrip' && activeSegmentId === segments[0]?.id) {
        return dayStr === selectedDate || dayStr === returnDate;
      }
      const seg = segments.find((s) => s.id === activeSegmentId);
      return seg ? seg.date === dayStr : false;
    }
    return false;
  };

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
      const basePrice = 300 + (d % 5) * 50 + offset * 20;
      const isCheap = basePrice < 400;

      let bgClass = '';
      let textClass = 'text-gray-700';

      if (selected) {
        bgClass = 'bg-blue-600 text-white rounded-full hover:bg-blue-700';
        textClass = 'text-white';
        if (tripType === 'roundTrip' && activeSegmentId === segments[0]?.id) {
          if (dateStr === selectedDate && returnDate) bgClass = 'bg-blue-600 text-white rounded-l-full rounded-r-none';
          if (dateStr === returnDate) bgClass = 'bg-blue-600 text-white rounded-r-full rounded-l-none';
          if (dateStr === selectedDate && !returnDate) bgClass = 'bg-blue-600 text-white rounded-full';
        }
      } else if (inRange) {
        bgClass = 'bg-blue-50';
        textClass = 'text-blue-700';
      } else if (isPast) {
        textClass = 'text-gray-200 cursor-not-allowed';
      } else {
        bgClass = 'hover:bg-blue-50 cursor-pointer';
      }

      days.push(
        <button
          key={dateStr}
          type="button"
          disabled={isPast}
          onClick={(e) => {
            e.stopPropagation();
            handleDateSelect(dateStr);
          }}
          className={`relative h-10 w-full flex flex-col items-center justify-center text-sm font-medium transition-all ${bgClass} ${textClass}`}
        >
          <span className="z-10 relative">{d}</span>
          {!isPast && !selected && !inRange && (
            <span className={`text-[9px] scale-75 -mt-1 font-medium ${isCheap ? 'text-green-600' : 'text-gray-400'}`}>
              ¥{basePrice}
            </span>
          )}
        </button>
      );
    }

    return (
      <div className="w-full">
        <div className="text-center font-bold text-gray-800 mb-4 text-sm">
          {year}年 {month + 1}月
        </div>
        <div className="grid grid-cols-7 gap-y-2 text-center mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
            <div key={d} className="text-xs text-gray-400">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">{days}</div>
      </div>
    );
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    const n = new Date(pickerViewDate);
    n.setMonth(n.getMonth() + 1);
    setPickerViewDate(n);
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    const p = new Date(pickerViewDate);
    const today = new Date();
    today.setDate(1);
    p.setMonth(p.getMonth() - 1);
    if (p >= today || (p.getMonth() === today.getMonth() && p.getFullYear() === today.getFullYear())) {
      setPickerViewDate(p);
    }
  };

  return (
    <div
      className="absolute top-full z-50 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 w-[650px] animate-in fade-in zoom-in-95 duration-200 mt-2 left-0 md:left-auto"
      style={
        activeSegmentId && activeSegmentId !== segments[0]?.id
          ? { left: '0', zIndex: 60 }
          : { left: '50%', transform: 'translateX(-50%)', zIndex: 60 }
      }
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-6">
        <button type="button" onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="font-bold text-lg text-gray-800">选择日期</div>
        <button type="button" onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      <div className="flex gap-8">
        <div className="flex-1 border-r border-gray-100 pr-4">{renderMonth(0)}</div>
        <div className="flex-1 pl-4">{renderMonth(1)}</div>
      </div>
    </div>
  );
};
