import React from 'react';

export const MapStyles: React.FC = () => {
  return (
    <style>
      {`
          @keyframes pulse-radius {
            0%, 100% { r: 5px; }
            50% { r: 8px; }
          }
          @keyframes pulse-radius-large {
            0%, 100% { r: 10px; }
            50% { r: 18px; }
          }
          @keyframes pulse-opacity {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.8; }
          }
          @keyframes fly-path {
            0% { offset-distance: 0%; }
            100% { offset-distance: 100%; }
          }
          @keyframes dash-flow {
            0% { stroke-dashoffset: 1000; }
            100% { stroke-dashoffset: 0; }
          }

          .world-map-landmass svg :is(path, polygon, rect, circle, ellipse) {
            fill: var(--wm-land-fill) !important;
            stroke: var(--wm-land-stroke, none) !important;
            stroke-width: 0.5px;
            vector-effect: non-scaling-stroke;
          }
        `}
    </style>
  );
};
