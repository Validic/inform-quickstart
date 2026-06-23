'use client';

import { useState, useMemo } from 'react';
import { ReadingLogEntry } from '@/types';

interface CGMChartProps {
  readings: ReadingLogEntry[];
  unit: string;
}

// Glucose zones (mg/dL)
const ZONES = {
  veryLow: { max: 54, color: '#ef4444', label: 'Very Low' },
  low: { max: 70, color: '#f97316', label: 'Low' },
  target: { max: 180, color: '#22c55e', label: 'In Range' },
  high: { max: 250, color: '#f59e0b', label: 'High' },
  veryHigh: { max: Infinity, color: '#dc2626', label: 'Very High' },
};

function getZone(value: number) {
  if (value < ZONES.veryLow.max) return ZONES.veryLow;
  if (value < ZONES.low.max) return ZONES.low;
  if (value < ZONES.target.max) return ZONES.target;
  if (value < ZONES.high.max) return ZONES.high;
  return ZONES.veryHigh;
}

function getZoneColor(value: number) {
  return getZone(value).color;
}

export default function CGMChart({ readings, unit }: CGMChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate unique ID for this chart instance (for gradient)
  const [gradientId] = useState(() => `cgm-gradient-${Math.random().toString(36).slice(2, 11)}`);

  // Chart dimensions (constants, used in memos below)
  const chartHeight = 120;
  const minValue = 40;
  const maxValue = 300;
  const valueRange = maxValue - minValue;

  // Sort readings by time
  const sortedReadings = useMemo(() => {
    if (!readings || readings.length === 0) return [];
    return [...readings].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [readings]);

  // Calculate stats
  const stats = useMemo(() => {
    if (sortedReadings.length === 0) return null;
    const values = sortedReadings.map(r => r.value);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const stdDev = Math.round(Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length));
    const inRange = values.filter(v => v >= 70 && v <= 180).length;
    const belowRange = values.filter(v => v < 70).length;
    const aboveRange = values.filter(v => v > 180).length;
    const timeInRange = Math.round((inRange / values.length) * 100);
    const timeBelow = Math.round((belowRange / values.length) * 100);
    const timeAbove = Math.round((aboveRange / values.length) * 100);
    const estimatedA1C = ((avg + 46.7) / 28.7).toFixed(1);
    return { avg, min, max, stdDev, timeInRange, timeBelow, timeAbove, estimatedA1C, total: values.length };
  }, [sortedReadings]);

  // Generate SVG path for the glucose line
  const linePath = useMemo(() => {
    if (sortedReadings.length < 2) return '';
    const points = sortedReadings.map((reading, i) => {
      const x = (i / (sortedReadings.length - 1)) * 100;
      const y = chartHeight - ((reading.value - minValue) / valueRange) * chartHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [sortedReadings, chartHeight, minValue, valueRange]);

  // Generate area path (filled area under the line)
  const areaPath = useMemo(() => {
    if (sortedReadings.length < 2) return '';
    const points = sortedReadings.map((reading, i) => {
      const x = (i / (sortedReadings.length - 1)) * 100;
      const y = chartHeight - ((reading.value - minValue) / valueRange) * chartHeight;
      return `${x},${y}`;
    });
    return `M 0,${chartHeight} L ${points.join(' L ')} L 100,${chartHeight} Z`;
  }, [sortedReadings, chartHeight, minValue, valueRange]);

  // Early returns — after all hooks
  if (!readings || readings.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-4 text-center text-gray-500">
        No CGM readings available
      </div>
    );
  }
  if (!stats) return null;

  const handleCopyJson = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(JSON.stringify({ readings: sortedReadings, stats }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get time label for a reading
  const getTimeLabel = (reading: ReadingLogEntry) => {
    const time = reading.display_time || reading.time;
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Target range zone lines
  const targetLowY = chartHeight - ((70 - minValue) / valueRange) * chartHeight;
  const targetHighY = chartHeight - ((180 - minValue) / valueRange) * chartHeight;

  if (showJson) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400 font-medium">CGM Readings JSON</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="p-1.5 rounded hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
            >
              {copied ? (
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setShowJson(false)}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Back to chart
            </button>
          </div>
        </div>
        <pre className="bg-gray-900/70 rounded-lg p-3 text-[10px] text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
          {JSON.stringify({ readings: sortedReadings, stats }, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-xl p-4">
      {/* Header with stats */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{stats.avg}</span>
            <span className="text-sm text-gray-500">{unit}</span>
            <span className="text-xs text-gray-600">avg</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>eA1C: <span className="text-purple-400 font-medium">{stats.estimatedA1C}%</span></span>
            <span>•</span>
            <span>CV: <span className="text-blue-400 font-medium">{Math.round((stats.stdDev / stats.avg) * 100)}%</span></span>
          </div>
        </div>
        <button
          onClick={() => setShowJson(true)}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          JSON
        </button>
      </div>

      {/* Mini chart */}
      <div className="relative h-32 mb-4">
        {/* Target range background */}
        <div
          className="absolute left-0 right-0 bg-green-500/10 border-y border-green-500/20"
          style={{
            top: `${targetHighY}px`,
            height: `${targetLowY - targetHighY}px`,
          }}
        />

        {/* Target range labels */}
        <div
          className="absolute left-0 text-[9px] text-green-500/60 font-medium"
          style={{ top: `${targetHighY - 10}px` }}
        >
          180
        </div>
        <div
          className="absolute left-0 text-[9px] text-green-500/60 font-medium"
          style={{ top: `${targetLowY}px` }}
        >
          70
        </div>

        {/* SVG Chart */}
        <svg
          className="w-full h-full"
          viewBox={`0 0 100 ${chartHeight}`}
          preserveAspectRatio="none"
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={areaPath}
            fill={`url(#${gradientId})`}
          />

          {/* Main line */}
          <path
            d={linePath}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data points (on hover) */}
          {sortedReadings.map((reading, i) => {
            const x = (i / (sortedReadings.length - 1)) * 100;
            const y = chartHeight - ((reading.value - minValue) / valueRange) * chartHeight;
            const isHovered = hoveredIndex === i;

            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={isHovered ? 1.5 : 0.8}
                fill={getZoneColor(reading.value)}
                className="transition-all duration-150 cursor-pointer"
                style={{
                  opacity: isHovered ? 1 : 0.6,
                  filter: isHovered ? `drop-shadow(0 0 3px ${getZoneColor(reading.value)})` : 'none'
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs shadow-lg z-10 pointer-events-none"
            style={{
              left: `${(hoveredIndex / (sortedReadings.length - 1)) * 100}%`,
              top: '-8px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-bold" style={{ color: getZoneColor(sortedReadings[hoveredIndex].value) }}>
              {sortedReadings[hoveredIndex].value} {unit}
            </div>
            <div className="text-gray-400">{getTimeLabel(sortedReadings[hoveredIndex])}</div>
          </div>
        )}
      </div>

      {/* Time in range bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Time in Range</span>
          <span className="text-green-400 font-medium">{stats.timeInRange}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex bg-gray-800">
          {stats.timeBelow > 0 && (
            <div
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
              style={{ width: `${stats.timeBelow}%` }}
              title={`Below range: ${stats.timeBelow}%`}
            />
          )}
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${stats.timeInRange}%` }}
            title={`In range: ${stats.timeInRange}%`}
          />
          {stats.timeAbove > 0 && (
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
              style={{ width: `${stats.timeAbove}%` }}
              title={`Above range: ${stats.timeAbove}%`}
            />
          )}
        </div>
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span className="text-orange-400">{stats.timeBelow}% low</span>
          <span className="text-yellow-400">{stats.timeAbove}% high</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-blue-400">{stats.min}</div>
          <div className="text-[10px] text-gray-500">Min</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-purple-400">{stats.avg}</div>
          <div className="text-[10px] text-gray-500">Avg</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-orange-400">{stats.max}</div>
          <div className="text-[10px] text-gray-500">Max</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-cyan-400">{stats.total}</div>
          <div className="text-[10px] text-gray-500">Readings</div>
        </div>
      </div>

      {/* Hourly distribution */}
      <div className="mt-4">
        <div className="text-xs text-gray-500 mb-2">24-Hour Distribution</div>
        <div className="flex h-8 gap-px">
          {Array.from({ length: 24 }, (_, hour) => {
            const hourReadings = sortedReadings.filter(r => {
              const time = r.display_time || r.time;
              const readingHour = new Date(time).getHours();
              return readingHour === hour;
            });

            const avgValue = hourReadings.length > 0
              ? hourReadings.reduce((sum, r) => sum + r.value, 0) / hourReadings.length
              : null;

            const heightPercent = avgValue
              ? Math.min(100, Math.max(10, ((avgValue - minValue) / valueRange) * 100))
              : 5;

            return (
              <div
                key={hour}
                className="flex-1 flex flex-col justify-end group relative"
              >
                <div
                  className="w-full rounded-t transition-all duration-300 group-hover:opacity-100"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: avgValue ? getZoneColor(avgValue) : '#374151',
                    opacity: avgValue ? 0.7 : 0.3,
                  }}
                />
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20">
                  <div className="bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[9px] whitespace-nowrap">
                    <div className="text-gray-400">{hour}:00</div>
                    {avgValue ? (
                      <div style={{ color: getZoneColor(avgValue) }}>{Math.round(avgValue)} {unit}</div>
                    ) : (
                      <div className="text-gray-600">No data</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-gray-600 mt-1">
          <span>12am</span>
          <span>6am</span>
          <span>12pm</span>
          <span>6pm</span>
          <span>12am</span>
        </div>
      </div>
    </div>
  );
}
