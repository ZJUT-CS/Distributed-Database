import React, { useState } from 'react';
import { MapPoint } from '../../types';

interface WorldMapProps {
  points: MapPoint[];
  routes?: { from: string; to: string }[];
  className?: string;
  showGrid?: boolean;
  theme?: 'light' | 'dark';
}

const WorldMap: React.FC<WorldMapProps> = ({ 
  points, 
  routes, 
  className = "", 
  showGrid = true,
  theme = 'light'
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<MapPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const isDark = theme === 'dark';

  // 地图原始尺寸常量
  const MAP_WIDTH = 1016;
  const MAP_HEIGHT = 560;

  // 这里的偏移量用于手动校准标点位置
  const mapOffsetX = -30; 
  const mapOffsetY = 66;

  // Colors based on theme
  const colors = {
    grid: isDark ? '#334155' : '#f1f5f9',
    hub: '#ef4444',
    origin: '#3b82f6',
    destination: '#10b981',
    routeStroke: isDark ? 'url(#routeGradientDark)' : '#3b82f6',
    planeFill: isDark ? '#60a5fa' : '#2563eb',
    mapOpacity: isDark ? 0.4 : 0.3,
    mapFilter: isDark ? 'invert(1) brightness(2) contrast(0.6) hue-rotate(180deg)' : 'none'
  };

  const getPointColor = (type: string) => {
    if (type === 'hub') return colors.hub;
    if (type === 'origin') return colors.origin;
    if (type === 'destination') return colors.destination;
    return '#eab308';
  };

  const renderGrid = () => {
    const lines = [];
    // 扩展网格范围以覆盖 viewBox 区域
    for (let i = -500; i < 1600; i += 50) {
      lines.push(<line key={`v-${i}`} x1={i} y1="-300" x2={i} y2="1200" stroke={colors.grid} strokeWidth="1" opacity={isDark ? 0.1 : 1} />);
    }
    for (let i = -300; i < 1200; i += 50) {
      lines.push(<line key={`h-${i}`} x1="-500" y1={i} x2="1600" y2={i} stroke={colors.grid} strokeWidth="1" opacity={isDark ? 0.1 : 1} />);
    }
    return lines;
  };

  // 投影算法 (基于 1016x514)
  const project = (lat: number, lng: number) => {
    // X轴: -180 ~ 180 => 0 ~ 1009
    const x = ((lng + 180) * MAP_WIDTH) / 360 + mapOffsetX;
    
    // Y轴: 90 ~ -90 => 0 ~ 665
    const y = ((-lat + 90) * MAP_HEIGHT) / 180 + mapOffsetY;
    
    return { x, y }; 
  };

  return (
    <div className={`relative w-full h-full rounded-xl overflow-hidden ${className} ${!className.includes('bg-') ? (isDark ? 'bg-transparent' : 'bg-slate-50') : ''}`}>
      {/* 
        ViewBox 调整说明:
        - 宽度 1250 / 高度 800: 保持放大效果 (1.5倍左右)。
        - 起点 (-150, -110): 
          Y = -110 是关键。地图图片高度 665，中心点约 332。
          ViewBox 高度 800，中心点 400。
          (332 - 400) ≈ -68。取 -110 可以让地图在垂直方向上绝对居中。
          这样可以确保顶部（北极圈）和底部（澳大利亚/新西兰）都包含在视口内。
      */}
      <svg 
        viewBox="-150 -120 1250 800" 
        className="w-full h-full block"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
            <linearGradient id="routeGradientDark" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>
            
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        {/* Background Grid */}
        {showGrid && renderGrid()}
        
        {/* World Map Image (Updated Dimensions) */}
        <image 
            href="https://upload.wikimedia.org/wikipedia/commons/d/db/Simplified_World_Map.svg" 
            x="0" 
            y="0" 
            width={MAP_WIDTH} 
            height={MAP_HEIGHT}
            opacity={colors.mapOpacity}
            className="pointer-events-none transition-all duration-500"
            style={{ filter: colors.mapFilter }}
        />

        {/* Routes Rendering */}
        {routes && routes.map((route, idx) => {
           const startPoint = points.find(p => p.id === route.from);
           const endPoint = points.find(p => p.id === route.to);
           if (!startPoint || !endPoint) return null;
           
           const start = project(startPoint.lat, startPoint.lng);
           const end = project(endPoint.lat, endPoint.lng);

           const midX = (start.x + end.x) / 2;
           // 曲线控制点
           const midY = Math.min(start.y, end.y) - 150;

           const pathD = `M${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;

           return (
             <g key={`route-special-${idx}`}>
               <path
                 d={pathD}
                 fill="none"
                 stroke={colors.routeStroke}
                 strokeWidth="2"
                 strokeLinecap="round"
                 opacity="0.3"
               />

               <path
                 d={pathD}
                 fill="none"
                 stroke={colors.routeStroke}
                 strokeWidth="3"
                 strokeLinecap="round"
                 strokeDasharray="10, 20"
                 opacity="0.8"
                 filter={isDark ? "url(#glow)" : ""}
               >
                  <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite" />
               </path>
               
               <circle r="4" fill={colors.planeFill} filter={isDark ? "url(#glow)" : ""}>
                  <animateMotion dur="3s" repeatCount="indefinite" path={pathD} rotate="auto">
                    <mpath href={`#routePath-${idx}`} />
                  </animateMotion>
               </circle>
               
               <path id={`routePath-${idx}`} d={pathD} fill="none" stroke="none" />
             </g>
           );
        })}

        {/* Normal Mode Radiation Lines */}
        {!routes && points.filter(p => p.type === 'normal').map((target, idx) => {
            const hub = points.find(p => p.type === 'hub') || points[0];
            const start = project(hub.lat, hub.lng);
            const end = project(target.lat, target.lng);
            return (
                <path
                    key={`line-${idx}`}
                    d={`M${start.x} ${start.y} Q ${(start.x + end.x)/2} ${Math.min(start.y, end.y) - 50} ${end.x} ${end.y}`}
                    fill="none"
                    stroke={target.type === 'hub' ? '#ef4444' : '#3b82f6'}
                    strokeWidth="1"
                    strokeOpacity="0.2"
                    strokeDasharray="5,5"
                >
                    <animate attributeName="stroke-dashoffset" from="100" to="0" dur="3s" repeatCount="indefinite" />
                </path>
            );
        })}

        {/* Points */}
        {points.map((point) => {
          const { x, y } = project(point.lat, point.lng);
          const isLarge = point.type === 'hub' || point.type === 'origin' || point.type === 'destination';
          
          const pointColor = getPointColor(point.type);

          return (
            <g 
              key={point.id} 
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltipPos({ x: rect.left + window.scrollX, y: rect.top + window.scrollY - 10 });
                setHoveredPoint(point);
              }}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={x} cy={y} r={isLarge ? 15 : 8} fill={pointColor} opacity={isDark ? 0.6 : 0.3}>
                <animate attributeName="r" values={isLarge ? "10;25;10" : "5;12;5"} dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values={isDark ? "0.6;0;0.6" : "0.3;0;0.3"} dur="3s" repeatCount="indefinite" />
              </circle>
              
              <circle 
                  cx={x} 
                  cy={y} 
                  r={isLarge ? 5 : 3} 
                  fill={pointColor} 
                  stroke={isDark ? "#fff" : "#fff"} 
                  strokeWidth="1.5"
                  filter={isDark ? "url(#glow)" : ""}
              />
              
              {(point.type === 'origin' || point.type === 'destination') && (
                 <text 
                    x={x} 
                    y={y + 25} 
                    textAnchor="middle" 
                    fill={isDark ? "#e2e8f0" : "#334155"} 
                    fontSize="14" 
                    fontWeight="bold"
                    style={{ textShadow: isDark ? '0 2px 4px #000' : '0 1px 2px rgba(255,255,255,0.8)' }}
                 >
                   {point.id}
                 </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredPoint && (
        <div 
          className="fixed z-50 bg-slate-900/90 text-white text-xs rounded-lg py-2 px-3 shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 border border-slate-700 backdrop-blur-sm"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="font-bold mb-1 border-b border-slate-700 pb-1 text-slate-200">{hoveredPoint.name}</div>
          <div className="flex items-center gap-2 whitespace-nowrap">
             <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: getPointColor(hoveredPoint.type) }}></span>
             <span className="text-slate-300">{hoveredPoint.info || hoveredPoint.id}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldMap;
