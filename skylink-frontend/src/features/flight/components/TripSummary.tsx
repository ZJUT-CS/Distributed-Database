import React from 'react';
import type { Flight, TripSegment } from '../types';
import { Check, Plane, Clock, ArrowRight } from 'lucide-react';
import { POPULAR_AIRPORTS } from '@/config/data/airports';

interface TripSummaryProps {
  segments: TripSegment[];
  selectedFlights: Flight[];
  currentLegIndex: number;
  onEditStep: (index: number) => void;
}

const TripSummary: React.FC<TripSummaryProps> = ({ segments, selectedFlights, currentLegIndex, onEditStep }) => {
  const getCityName = (code: string) => POPULAR_AIRPORTS.find((a) => a.code === code)?.city || code;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.toLocaleDateString('zh-CN', { weekday: 'short' })}`;
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  const currentTotal = selectedFlights.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-lg border border-blue-100 dark:border-white/10 overflow-hidden mb-6 animate-fade-in-down backdrop-blur-sm">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-indigo-900 px-6 py-4 flex justify-between items-center text-white">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-400" />
            行程概览
          </h3>
          <p className="text-xs text-blue-200 mt-0.5">请依次选择您的航班</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-blue-200">当前总价</div>
          <div className="font-bold text-xl text-yellow-400">¥{currentTotal.toLocaleString()}</div>
        </div>
      </div>

      <div className="p-2 bg-slate-50 dark:bg-transparent">
        {segments.map((segment, index) => {
          const isCompleted = index < currentLegIndex;
          const isActive = index === currentLegIndex;
          const flight = selectedFlights[index];

          return (
            <div
              key={index}
              onClick={() => (isCompleted ? onEditStep(index) : null)}
              className={`relative mb-2 last:mb-0 rounded-lg p-4 border transition-all ${isActive
                ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-md z-10 scale-[1.01]'
                : isCompleted
                  ? 'bg-white dark:bg-slate-800/60 border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100 cursor-pointer'
                  : 'bg-gray-100 dark:bg-slate-800/30 border-transparent opacity-50'
                }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                      <span>{formatDate(segment.date)}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                      <span>{getCityName(segment.origin)}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span>{getCityName(segment.destination)}</span>
                    </div>
                  </div>

                  <div className="md:col-span-8">
                    {flight ? (
                      <div className="flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/20 p-2 rounded border border-blue-100/50 dark:border-blue-800/30">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-blue-700 dark:text-blue-300">
                            {formatTime(flight.departureTime)} - {formatTime(flight.arrivalTime)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{flight.airline}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">{flight.duration}</span>
                          {isActive && <span className="text-xs text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded">修改</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 flex items-center gap-2">
                        {isActive ? <span className="text-blue-600 dark:text-blue-400 font-medium animate-pulse">正在选择此航段...</span> : <span>待选择</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TripSummary;
