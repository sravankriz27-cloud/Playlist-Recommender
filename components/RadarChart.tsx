
import React from 'react';
import { PlaylistPreferences } from '../types';

interface RadarChartProps {
  data: PlaylistPreferences;
}

const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  const size = 200;
  const center = size / 2;
  const radius = size * 0.4;
  
  const axes = [
    { label: 'Mood', val: data.mood },
    { label: 'Energy', val: data.energy },
    { label: 'Popularity', val: data.popularity },
    { label: 'Dance', val: data.danceability },
    { label: 'Acoustic', val: data.acousticness },
    { label: 'Instrum', val: data.instrumentalness },
  ];

  const points = axes.map((axis, i) => {
    const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
    const distance = (axis.val / 100) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grids */}
        {gridLevels.map((lvl, idx) => (
          <polygon
            key={idx}
            points={axes.map((_, i) => {
              const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
              const d = lvl * radius;
              return `${center + d * Math.cos(angle)},${center + d * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(168, 85, 247, 0.1)"
            strokeWidth="1"
          />
        ))}
        
        {/* Axes lines */}
        {axes.map((_, i) => {
          const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center} y1={center}
              x2={x} y2={y}
              stroke="rgba(168, 85, 247, 0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Shape */}
        <polygon
          points={points}
          fill="rgba(168, 85, 247, 0.3)"
          stroke="#a855f7"
          strokeWidth="2"
          className="transition-all duration-300 ease-in-out"
        />

        {/* Labels */}
        {axes.map((axis, i) => {
          const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
          const x = center + (radius + 15) * Math.cos(angle);
          const y = center + (radius + 15) * Math.sin(angle);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              className="text-[8px] fill-zinc-500 font-bold uppercase tracking-tighter"
            >
              {axis.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default RadarChart;
