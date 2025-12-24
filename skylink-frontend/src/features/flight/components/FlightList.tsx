import React from 'react';
import type { Flight } from '../types';
import { Plane, ArrowRight, Luggage, Zap, Utensils, Wifi, MonitorPlay } from 'lucide-react';

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
      <div className="text-center py-20">
        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Plane className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">未找到航班</h3>
        <p className="text-gray-500">请尝试更改日期或目的地。</p>
      </div>
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
        <Icon className="w-3.5 h-3.5 text-blue-500 cursor-help" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap relative">
            {label}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {flights.map((flight) => (
        <div
          key={flight.id}
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-start gap-4 min-w-[200px] self-stretch md:self-auto">
            <div className="w-12 h-12 mt-1 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
              {flight.airlineCode}
            </div>

            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1 bg-cyan-50 text-cyan-600 border border-cyan-100 text-[10px] px-1.5 py-0.5 rounded-sm">
                <Luggage className="w-3 h-3" />
                <span>托运行李 {flight.baggageWeight} 公斤</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <p className="font-bold text-gray-900 text-lg leading-tight">{flight.airline}</p>
                {flight.isInterline && flight.segments ? (
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {flight.segments.map((seg, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-3.5 h-3.5 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-600">{idx + 1}</span>
                        <span className="font-mono">{seg.flightNumber}</span>
                        <span className="text-gray-300">|</span>
                        <span>{seg.airline}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 font-mono">{flight.flightNumber}</p>
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

          <div className="flex-1 flex items-center justify-center gap-6 w-full md:w-auto border-t md:border-t-0 border-dashed border-gray-100 pt-4 md:pt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{formatTime(flight.departureTime)}</p>
              <p className="text-sm font-medium text-gray-500">{flight.origin}</p>
            </div>

            <div className="flex flex-col items-center min-w-[100px]">
              <p className="text-xs text-gray-400 mb-1">{flight.duration}</p>
              <div className="w-full h-[2px] bg-gray-200 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                  {flight.stops === 0 ? (
                    <Plane className="w-4 h-4 text-gray-300 rotate-90" />
                  ) : (
                    <span className="text-xs text-orange-500 font-medium">{flight.stops} 转机</span>
                  )}
                </div>
              </div>

              {/* 联程航班中转信息 - 优化版布局 */}
              {flight.stops > 0 && (
                <div className="mt-3 flex flex-col items-center gap-1.5 w-full">
                  {/* 中转时长 + 城市 */}
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-50 to-amber-50 rounded-full border border-orange-100 shadow-sm">
                    {flight.transferCity && (
                      <span className="text-xs text-amber-700 font-bold">
                        经 {flight.transferCity}
                      </span>
                    )}
                    <span className="w-1 h-1 rounded-full bg-orange-300"></span>
                    <span className={`text-xs font-mono font-medium ${(flight.transferDuration || 0) < 120 ? 'text-orange-600' : 'text-amber-600'
                      }`}>
                      {Math.floor((flight.transferDuration || 0) / 60)}h {(flight.transferDuration || 0) % 60}m
                    </span>
                  </div>

                  {/* 航司组合 (简化显示) */}
                  {flight.segments && flight.segments.length > 0 && (
                    <div className="flex items-center gap-1 opacity-60 text-[10px] text-gray-500">
                      <span>{flight.segments.map(s => s.airlineCode).join('+')}</span>
                      <span>联程</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{formatTime(flight.arrivalTime)}</p>
              <p className="text-sm font-medium text-gray-500">{flight.destination}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-end">
            {renderPrice ? (
              renderPrice(flight)
            ) : (
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">¥{flight.price.toLocaleString()}</p>
                <p className="text-xs text-gray-400">含税总价</p>
              </div>
            )}

            {renderAction ? (
              renderAction(flight)
            ) : (
              <button
                onClick={() => onSelect(flight)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                预订 <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FlightList;
