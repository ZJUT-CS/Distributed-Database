import React from 'react';
import type { Flight } from '../types';
import { Plane, ArrowRight, Luggage, Zap, Utensils, Wifi, MonitorPlay } from 'lucide-react';
import { EmptyStateFlights } from '@/components/common';

interface FlightListProps {
  flights: Flight[];
  onSelect: (flight: Flight) => void;
  renderAction?: (flight: Flight) => React.ReactNode;
  renderPrice?: (flight: Flight) => React.ReactNode;
}

const FlightList: React.FC<FlightListProps> = ({ flights, onSelect, renderAction, renderPrice }) => {
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  if (flights.length === 0) {
    return (
      <EmptyStateFlights
        variant="illustrated"
        size="lg"
        className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900/50"
      />
    );
  }

  const AmenityIcon = ({
    icon: Icon,
    label,
    active,
  }: {
    icon: React.ElementType;
    label: string;
    active: boolean;
  }) => {
    if (!active) return null;
    return (
      <div className="group relative">
        <Icon className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 cursor-help" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
          <div className="bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap relative">
            {label}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800 dark:border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {flights.map((flight, idx) => (
        <div
          key={flight.id}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 dark:shadow-gray-900/30 dark:hover:shadow-gray-800/50 transition-all duration-300 border border-slate-100 dark:border-gray-700/50 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 group hover:-translate-y-1 animate-fade-in"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          <div className="flex items-start gap-4 min-w-[200px] self-stretch md:self-auto">
            <div className="w-12 h-12 mt-1 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0">
              {flight.airlineCode}
            </div>

            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-800/50 text-[10px] px-1.5 py-0.5 rounded-sm">
                <Luggage className="w-3 h-3" />
                <span>托运行李 {flight.baggageAllowance || `${flight.baggageWeight}KG`}</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <p className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight">{flight.airline}</p>
                {flight.isInterline && flight.segments ? (
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {flight.segments.map((seg, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <span className="w-3.5 h-3.5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-gray-300">{idx + 1}</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300">{seg.flightNumber}</span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className="text-gray-600 dark:text-gray-300">{seg.airline}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-300 font-mono">{flight.flightNumber}</p>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1 h-4">
                <AmenityIcon icon={Zap} label="USB/电源插座" active={flight.amenities.hasPower} />
                <AmenityIcon icon={Utensils} label="提供餐饮" active={flight.amenities.hasMeal} />
                <AmenityIcon icon={Wifi} label="机上 WiFi" active={flight.amenities.hasWifi} />
                <AmenityIcon icon={MonitorPlay} label="机上娱乐系统" active={flight.amenities.hasEntertainment} />
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center gap-6 w-full md:w-auto border-t md:border-t-0 border-dashed border-gray-100 dark:border-gray-700/50 pt-4 md:pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatTime(flight.departureTime)}</p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{flight.origin}</p>
            </div>

            <div className="flex flex-col items-center min-w-[100px]">
              <p className="text-xs text-gray-400 dark:text-gray-300 mb-1">{flight.duration}</p>
              <div className="w-full h-[2px] bg-gray-200 dark:bg-gray-600 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-2">
                  {flight.stops === 0 ? (
                    <Plane className="w-4 h-4 text-gray-300 dark:text-gray-500 rotate-90" />
                  ) : (
                    <span className="text-xs text-orange-500 dark:text-orange-400 font-medium">{flight.stops} 转机</span>
                  )}
                </div>
              </div>

              {/* 联程航班中转信息 - 优化版布局 */}
              {flight.stops > 0 && (
                <div className="mt-3 flex flex-col items-center gap-1.5 w-full">
                  {/* 中转时长 + 城市 */}
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-50 dark:from-orange-900/30 to-amber-50 dark:to-amber-900/30 rounded-full border border-orange-100 dark:border-orange-800/50 shadow-sm">
                    {flight.transferCity && (
                      <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                        经 {flight.transferCity}
                      </span>
                    )}
                    <span className="w-1 h-1 rounded-full bg-orange-300 dark:bg-orange-500"></span>
                    <span className={`text-xs font-mono font-medium ${(flight.transferDuration || 0) < 120 ? 'text-orange-600 dark:text-orange-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                      {Math.floor((flight.transferDuration || 0) / 60)}h {(flight.transferDuration || 0) % 60}m
                    </span>
                  </div>

                  {/* 航司组合 (简化显示) */}
                  {flight.segments && flight.segments.length > 0 && (
                    <div className="flex items-center gap-1 opacity-60 text-[10px] text-gray-500 dark:text-gray-400">
                      <span>{flight.segments.map(s => s.airlineCode).join('+')}</span>
                      <span>联程</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatTime(flight.arrivalTime)}</p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{flight.destination}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-gray-200/50 dark:border-gray-700/50 pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-end">
            {renderPrice ? (
              renderPrice(flight)
            ) : (
              <div className="text-right">
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500 bg-clip-text text-transparent">¥{flight.price.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">含税总价</p>
              </div>
            )}

            {renderAction ? (
              renderAction(flight)
            ) : (
              <button
                onClick={() => onSelect(flight)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-7 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-600/30 hover:scale-105 active:scale-95 group-hover:translate-x-1"
              >
                预订 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// 添加淡入动画CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-fade-in {
      animation: fade-in 0.5s ease-out forwards;
      opacity: 0;
    }
  `;
  if (!document.head.querySelector('style[data-flight-list-animations]')) {
    style.setAttribute('data-flight-list-animations', '');
    document.head.appendChild(style);
  }
}

export default FlightList;
