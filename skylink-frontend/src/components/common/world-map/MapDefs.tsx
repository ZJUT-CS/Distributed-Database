import React from 'react';

interface MapDefsProps {
  isDark: boolean;
  gridColor: string;
}

export const MapDefs: React.FC<MapDefsProps> = ({ isDark, gridColor }) => {
  return (
    <defs>
      <linearGradient id="routeGradientDark" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
        <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
      </linearGradient>

      <filter id="glow-sm" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <filter id="glow-md" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <filter id="glow-lg" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <filter id="route-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <filter id="route-beam" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feFlood floodColor="#60a5fa" floodOpacity="0.6" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
        <feComposite in="SourceGraphic" in2="coloredBlur" operator="over" />
      </filter>

      <radialGradient id="city-glow-1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="city-glow-2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="city-glow-3" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </radialGradient>

      <linearGradient id="sweep-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
        <stop offset="30%" stopColor="#60a5fa" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#fff" stopOpacity="1" />
        <stop offset="70%" stopColor="#60a5fa" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
      </linearGradient>

      <pattern id="grid-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
        <path
          d="M 50 0 L 0 0 0 50"
          fill="none"
          stroke={gridColor}
          strokeWidth="1"
          opacity={isDark ? 0.1 : 1}
        />
      </pattern>
    </defs>
  );
};
