'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { DataTypeGroup } from '@/types';
import DataRecordCard from './DataRecordCard';

interface DataTypeGroupCardProps {
  group: DataTypeGroup;
}

// Animated icon components for each data type
function SummariesIcon({ hasData, isHovered }: { hasData: boolean; isHovered: boolean }) {
  const color = hasData ? '#22c55e' : '#4b5563';
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!hasData) return;
    const interval = setInterval(() => setStep(s => (s + 1) % 4), 200);
    return () => clearInterval(interval);
  }, [hasData]);

  // Walking feet animation - always animate when has data
  const leftFootY = hasData ? (step % 2 === 0 ? 14 : 18) : 16;
  const rightFootY = hasData ? (step % 2 === 1 ? 14 : 18) : 16;

  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      {/* Left foot */}
      <ellipse
        cx="8"
        cy={leftFootY}
        rx="3"
        ry="5"
        fill={color}
        className="transition-all duration-150"
        transform={`rotate(${hasData && step % 2 === 0 ? -15 : 0} 8 ${leftFootY})`}
      />
      {/* Right foot */}
      <ellipse
        cx="16"
        cy={rightFootY}
        rx="3"
        ry="5"
        fill={color}
        className="transition-all duration-150"
        transform={`rotate(${hasData && step % 2 === 1 ? -15 : 0} 16 ${rightFootY})`}
      />
      {/* Step trail when has data */}
      {hasData && (
        <>
          <circle cx="8" cy="22" r="1" fill={color} opacity="0.3" />
          <circle cx="16" cy="22" r="1" fill={color} opacity="0.2" />
        </>
      )}
    </svg>
  );
}

function WorkoutsIcon({ hasData, isHovered }: { hasData: boolean; isHovered: boolean }) {
  const color = hasData ? '#ef4444' : '#4b5563';
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!hasData) return;
    const interval = setInterval(() => setPulse(p => (p + 1) % 100), 30);
    return () => clearInterval(interval);
  }, [hasData]);

  // ECG line animation - always animate when has data
  const getEcgPath = () => {
    if (!hasData) {
      return "M2 12 L6 12 L8 8 L10 16 L12 4 L14 20 L16 12 L22 12";
    }
    const offset = pulse % 20;
    return `M2 12 L${6 + offset * 0.1} 12 L${8 + offset * 0.1} ${8 + Math.sin(pulse * 0.3) * 2} L${10 + offset * 0.1} ${16 - Math.sin(pulse * 0.3) * 2} L${12 + offset * 0.1} ${4 + Math.sin(pulse * 0.2) * 3} L${14 + offset * 0.1} ${20 - Math.sin(pulse * 0.2) * 3} L${16 + offset * 0.1} 12 L22 12`;
  };

  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path
        d={getEcgPath()}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="transition-colors duration-300"
      />
      {/* Traveling spark effect - always show when has data */}
      {hasData && (
        <circle
          cx={2 + (pulse % 40) * 0.5}
          cy="12"
          r="2"
          fill={color}
          className="animate-pulse"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      )}
    </svg>
  );
}

function SleepIcon({ hasData, isHovered }: { hasData: boolean; isHovered: boolean }) {
  const color = hasData ? '#8b5cf6' : '#4b5563';
  const [zzz, setZzz] = useState(0);

  useEffect(() => {
    if (!hasData) return;
    const interval = setInterval(() => setZzz(z => (z + 1) % 3), 400);
    return () => clearInterval(interval);
  }, [hasData]);

  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      {/* Moon */}
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill={color}
        className="transition-all duration-500"
        style={{ transformOrigin: 'center' }}
      />
      {/* Animated Z's - always show when has data */}
      {hasData && (
        <>
          <text
            x="16"
            y={8 - zzz * 2}
            fill={color}
            fontSize="6"
            fontWeight="bold"
            opacity={zzz === 0 ? 1 : 0.3}
            className="transition-all duration-300"
          >
            z
          </text>
          <text
            x="18"
            y={6 - zzz * 2}
            fill={color}
            fontSize="5"
            fontWeight="bold"
            opacity={zzz === 1 ? 1 : 0.3}
            className="transition-all duration-300"
          >
            z
          </text>
          <text
            x="20"
            y={4 - zzz * 2}
            fill={color}
            fontSize="4"
            fontWeight="bold"
            opacity={zzz === 2 ? 1 : 0.3}
            className="transition-all duration-300"
          >
            z
          </text>
        </>
      )}
      {/* Stars when has data */}
      {hasData && (
        <>
          <circle cx="4" cy="4" r="1" fill="#fef3c7" className="animate-pulse" />
          <circle cx="7" cy="2" r="0.5" fill="#fef3c7" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
        </>
      )}
    </svg>
  );
}

function NutritionIcon({ hasData, isHovered }: { hasData: boolean; isHovered: boolean }) {
  const color = hasData ? '#f59e0b' : '#4b5563';
  const [bite, setBite] = useState(false);

  useEffect(() => {
    if (!hasData) return;
    const interval = setInterval(() => setBite(b => !b), 300);
    return () => clearInterval(interval);
  }, [hasData]);

  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      {/* Fork */}
      <path
        d="M3 2v7c0 1.1.9 2 2 2h1v9a1 1 0 0 0 2 0v-9h1c1.1 0 2-.9 2-2V2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className={`transition-transform duration-150 ${hasData && bite ? 'translate-y-[-2px]' : ''}`}
      />
      <path d="M3 6h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Knife */}
      <path
        d="M17 2v20M21 12c0-5.5-2-10-4-10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className={`transition-transform duration-150 ${hasData && !bite ? 'translate-y-[-2px]' : ''}`}
      />
      {/* Food particles when eating - always show when has data */}
      {hasData && (
        <>
          <circle cx="12" cy="8" r="1" fill={color} opacity={bite ? 0.8 : 0} className="transition-opacity" />
          <circle cx="14" cy="10" r="0.5" fill={color} opacity={!bite ? 0.6 : 0} className="transition-opacity" />
        </>
      )}
    </svg>
  );
}

function MeasurementsIcon({ hasData, isHovered }: { hasData: boolean; isHovered: boolean }) {
  const color = hasData ? '#3b82f6' : '#4b5563';
  const [beat, setBeat] = useState(false);

  useEffect(() => {
    if (!hasData) return;
    const interval = setInterval(() => setBeat(b => !b), 500);
    return () => clearInterval(interval);
  }, [hasData]);

  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      {/* Heart with beat animation - always animate when has data */}
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={color}
        className={`transition-transform duration-200 ${hasData && beat ? 'scale-110' : 'scale-100'}`}
        style={{ transformOrigin: 'center' }}
      />
      {/* Pulse ring - always show when has data */}
      {hasData && beat && (
        <circle
          cx="12"
          cy="11"
          r="10"
          stroke={color}
          strokeWidth="1"
          fill="none"
          opacity="0.4"
          className="animate-ping"
        />
      )}
    </svg>
  );
}

function IntradayIcon({ hasData, isHovered }: { hasData: boolean; isHovered: boolean }) {
  const color = hasData ? '#06b6d4' : '#4b5563';
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!hasData) return;
    const interval = setInterval(() => setSeconds(s => (s + 6) % 60), 100);
    return () => clearInterval(interval);
  }, [hasData]);

  const secondAngle = (seconds / 60) * 360 - 90;

  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      {/* Clock face */}
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
      {/* Hour hand */}
      <line x1="12" y1="12" x2="12" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Minute hand */}
      <line x1="12" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Second hand - always animated when has data */}
      {hasData && (
        <line
          x1="12"
          y1="12"
          x2={12 + 7 * Math.cos(secondAngle * Math.PI / 180)}
          y2={12 + 7 * Math.sin(secondAngle * Math.PI / 180)}
          stroke={color}
          strokeWidth="1"
          strokeLinecap="round"
          className="transition-all duration-75"
        />
      )}
      {/* Center dot */}
      <circle cx="12" cy="12" r="1.5" fill={color} />
      {/* Tick marks - always show when has data */}
      {hasData && (
        <>
          <circle cx="12" cy="3" r="0.5" fill={color} />
          <circle cx="21" cy="12" r="0.5" fill={color} />
          <circle cx="12" cy="21" r="0.5" fill={color} />
          <circle cx="3" cy="12" r="0.5" fill={color} />
        </>
      )}
    </svg>
  );
}

function CGMIcon({ hasData, isHovered }: { hasData: boolean; isHovered: boolean }) {
  const color = hasData ? '#ec4899' : '#4b5563';
  const [drip, setDrip] = useState(0);

  useEffect(() => {
    if (!hasData) return;
    const interval = setInterval(() => setDrip(d => (d + 1) % 20), 100);
    return () => clearInterval(interval);
  }, [hasData]);

  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      {/* Blood drop */}
      <path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        fill={color}
        className="transition-transform duration-300"
        style={{ transformOrigin: 'center' }}
      />
      {/* Shine */}
      <ellipse cx="9" cy="12" rx="1.5" ry="2.5" fill="white" opacity="0.3" />
      {/* Dripping animation - always animate when has data */}
      {hasData && drip > 10 && (
        <ellipse
          cx="12"
          cy={20 + (drip - 10) * 0.5}
          rx="1"
          ry={1.5 - (drip - 10) * 0.1}
          fill={color}
          opacity={1 - (drip - 10) * 0.1}
          className="transition-all"
        />
      )}
      {/* Glucose reading indicator - always show when has data */}
      {hasData && (
        <text
          x="12"
          y="14"
          textAnchor="middle"
          fill="white"
          fontSize="6"
          fontWeight="bold"
          opacity="0.8"
        >
          mg
        </text>
      )}
    </svg>
  );
}

// Icon selector
function DataTypeIcon({ dataType, hasData, isHovered }: { dataType: string; hasData: boolean; isHovered: boolean }) {
  const props = { hasData, isHovered };

  switch (dataType) {
    case 'summaries': return <SummariesIcon {...props} />;
    case 'workouts': return <WorkoutsIcon {...props} />;
    case 'sleep': return <SleepIcon {...props} />;
    case 'nutrition': return <NutritionIcon {...props} />;
    case 'measurements': return <MeasurementsIcon {...props} />;
    case 'intraday': return <IntradayIcon {...props} />;
    case 'cgm': return <CGMIcon {...props} />;
    default: return <WorkoutsIcon {...props} />;
  }
}

// Color mapping for data types
const dataTypeColors: Record<string, string> = {
  summaries: '#22c55e',
  workouts: '#ef4444',
  sleep: '#8b5cf6',
  nutrition: '#f59e0b',
  measurements: '#3b82f6',
  intraday: '#06b6d4',
  cgm: '#ec4899',
};

export default function DataTypeGroupCard({ group }: DataTypeGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const color = dataTypeColors[group.dataType] || '#6b7280';
  const hasRecords = group.recordCount > 0;
  const displayColor = hasRecords ? color : '#4b5563';

  return (
    <div
      className={`
        glass-panel overflow-hidden transition-colors duration-300
        ${hasRecords ? 'opacity-100' : 'opacity-60'}
      `}
      style={{
        borderColor: isHovered && hasRecords ? `${color}40` : undefined,
        boxShadow: isHovered && hasRecords ? `0 4px 20px ${color}20` : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => hasRecords && setIsExpanded(!isExpanded)}
        className={`
          w-full p-4 flex items-center justify-between transition-colors
          ${hasRecords ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'}
        `}
        disabled={!hasRecords && group.status !== 'error'}
      >
        <div className="flex items-center gap-3">
          {/* Animated Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300"
            style={{
              backgroundColor: `${displayColor}20`,
            }}
          >
            <DataTypeIcon dataType={group.dataType} hasData={hasRecords} isHovered={isHovered} />
          </div>

          {/* Data type info */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className={`font-medium transition-colors duration-300 ${hasRecords ? 'text-white' : 'text-gray-500'}`}>
                {group.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
              {group.status === 'success' ? (
                <>
                  <CheckCircle2 className={`w-3 h-3 ${hasRecords ? 'text-green-500' : 'text-gray-500'}`} />
                  <span className={hasRecords ? '' : 'text-gray-500'}>
                    {group.recordCount} record{group.recordCount !== 1 ? 's' : ''}
                  </span>
                </>
              ) : group.status === 'error' ? (
                <>
                  <XCircle className="w-3 h-3 text-red-500" />
                  <span className="text-red-400">{group.error || 'Error fetching data'}</span>
                </>
              ) : (
                <span>Loading...</span>
              )}
            </div>
          </div>
        </div>

        {/* Expand toggle */}
        {hasRecords && (
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${color}20`,
                color: color,
              }}
            >
              {group.recordCount}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        )}
      </button>

      {/* Animated progress bar for items with data */}
      {hasRecords && (
        <div className="h-0.5 bg-gray-800">
          <div
            className={`h-full transition-all duration-500 ${isHovered ? 'w-full' : 'w-0'}`}
            style={{ backgroundColor: color }}
          />
        </div>
      )}

      {/* Expanded content - Records */}
      {isExpanded && hasRecords && (
        <div className="px-4 pb-4 border-t border-blue-500/10">
          <div className="mt-4 space-y-3">
            {group.records.map((record, index) => (
              <DataRecordCard
                key={record.id || `${group.dataType}-${index}`}
                record={{ ...record, type: record.type || group.dataType }}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
