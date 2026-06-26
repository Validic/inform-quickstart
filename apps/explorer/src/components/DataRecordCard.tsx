'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Tag, Code, LayoutGrid, Copy, Check } from 'lucide-react';
import { DataRecord } from '@/types';
import MetricCard from './MetricCard';

interface DataRecordCardProps {
  record: DataRecord;
  index: number;
}

export default function DataRecordCard({ record, index }: DataRecordCardProps) {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const [copied, setCopied] = useState(false);

  const handleCopyJson = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDateTime = (isoString: string | undefined): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category?: string): string => {
    const colors: Record<string, string> = {
      daily: '#22c55e',
      running: '#ef4444',
      biking: '#3b82f6',
      swimming: '#06b6d4',
      walking: '#eab308',
      cardio: '#f97316',
    };
    return colors[category || ''] || '#6b7280';
  };

  const getSourceDisplay = (source?: string | { type?: string; device?: string; devices?: Record<string, { id: string; model: string; manufacturer: string }> }): string => {
    if (!source) return '';
    if (typeof source === 'string') return source;
    // Handle object source
    const parts = [];
    if (source.type) parts.push(source.type);
    if (source.device) parts.push(source.device);
    // Handle CGM devices object
    if (source.devices) {
      const deviceList = Object.values(source.devices);
      if (deviceList.length > 0) {
        const device = deviceList[0];
        parts.push(`${device.manufacturer} ${device.model}`.toUpperCase());
      }
    }
    return parts.join(' - ') || 'unknown';
  };

  // Get display name based on record type and metrics
  const getDisplayName = (): string => {
    if (record.name) return record.name;

    // Check if this is CGM data (has reading_log in metrics)
    const hasCgmData = (record.metrics || []).some(m => m.reading_log && m.reading_log.length > 0);

    if (hasCgmData && record.log_id) {
      // Format date from log_id for CGM data
      const date = new Date(record.log_id);
      if (!isNaN(date.getTime())) {
        return `CGM Data - ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
      return `CGM Data - ${record.log_id}`;
    }

    // For measurement records, use the metric type as the display name
    if (record.type === 'measurement' && record.metrics && record.metrics.length > 0) {
      const metricType = record.metrics[0].type;
      // Format metric type: body_weight -> Body Weight, blood_pressure -> Blood Pressure
      const formatted = metricType
        .split('_')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return `${formatted} - ${record.log_id}`;
    }

    // For other types, use the record type
    if (record.type) return record.type.charAt(0).toUpperCase() + record.type.slice(1);

    // Fallback for records with just log_id
    if (record.log_id) return `Record - ${record.log_id}`;

    return 'Record';
  };

  // Get primary metric value for display in collapsed view
  const getPrimaryMetricDisplay = (): string | null => {
    if (!record.metrics || record.metrics.length === 0) return null;

    // Skip CGM data (has reading_log) - too complex for summary
    const primaryMetric = record.metrics[0];
    if (primaryMetric.reading_log && primaryMetric.reading_log.length > 0) return null;

    // Format the value with unit
    if (primaryMetric.value !== undefined && primaryMetric.unit) {
      return `${primaryMetric.value} ${primaryMetric.unit}`;
    }
    if (primaryMetric.value !== undefined) {
      return `${primaryMetric.value}`;
    }
    return null;
  };

  // Get pill color based on CGM time in range or category
  const getPillColor = (): string => {
    // Check if this is CGM data with reading_log
    const cgmMetric = (record.metrics || []).find(m => m.reading_log && m.reading_log.length > 0);

    if (cgmMetric && cgmMetric.reading_log) {
      const values = cgmMetric.reading_log.map(r => r.value);
      const total = values.length;

      const inRange = values.filter(v => v >= 70 && v <= 180).length;
      const belowRange = values.filter(v => v < 70).length;
      const aboveRange = values.filter(v => v > 180).length;

      const timeInRange = (inRange / total) * 100;
      const timeBelow = (belowRange / total) * 100;
      const timeAbove = (aboveRange / total) * 100;

      // Return color based on which zone has the majority
      if (timeInRange >= timeBelow && timeInRange >= timeAbove) {
        return '#22c55e'; // Green - in range
      } else if (timeBelow > timeAbove) {
        return '#f97316'; // Orange - below range (hypoglycemia)
      } else {
        return '#f59e0b'; // Yellow/amber - above range (hyperglycemia)
      }
    }

    // Fall back to category color for non-CGM data
    return getCategoryColor(record.category);
  };

  return (
    <div className="glass-panel overflow-hidden mb-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-8 rounded-full"
            style={{ backgroundColor: getPillColor() }}
          />
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">
                {getDisplayName()}
              </span>
              {record.category && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${getCategoryColor(record.category)}20`,
                    color: getCategoryColor(record.category),
                  }}
                >
                  {record.category}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
              {formatDateTime(record.start_time) && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(record.start_time)}
                </span>
              )}
              {getSourceDisplay(record.source) && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {getSourceDisplay(record.source)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getPrimaryMetricDisplay() && (
            <span className="text-lg font-semibold text-blue-300">
              {getPrimaryMetricDisplay()}
            </span>
          )}
          <span className="text-xs text-gray-500">
            {record.metrics?.length || 0} metrics
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-blue-500/10">
          {/* View Toggle */}
          <div className="flex items-center justify-between mt-3 mb-3">
            <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={(e) => { e.stopPropagation(); setViewMode('visual'); }}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                  viewMode === 'visual'
                    ? 'bg-blue-500/30 text-blue-300'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                Visual
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setViewMode('json'); }}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                  viewMode === 'json'
                    ? 'bg-blue-500/30 text-blue-300'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Code className="w-3 h-3" />
                JSON
              </button>
            </div>
            {viewMode === 'json' && (
              <button
                onClick={handleCopyJson}
                className="p-1.5 rounded hover:bg-gray-700/50 transition-colors flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                title="Copy JSON"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>

          {viewMode === 'visual' ? (
            <>
              {/* Separate CGM metrics (with reading_log) from regular metrics */}
              {(() => {
                const cgmMetrics = (record.metrics || []).filter(m => m.reading_log && m.reading_log.length > 0);
                const regularMetrics = (record.metrics || []).filter(m => !m.reading_log || m.reading_log.length === 0);

                return (
                  <>
                    {/* CGM metrics get full width */}
                    {cgmMetrics.length > 0 && (
                      <div className="space-y-4 mb-4">
                        {cgmMetrics.map((metric, idx) => (
                          <MetricCard key={`cgm-${metric.type}-${idx}`} metric={metric} />
                        ))}
                      </div>
                    )}

                    {/* Regular metrics in grid */}
                    {regularMetrics.length > 0 && (
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {regularMetrics.map((metric, idx) => (
                          <MetricCard key={`${metric.type}-${idx}`} metric={metric} />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Segments (for nutrition) */}
              {record.segments && record.segments.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-400">Meal Breakdown</h4>
                  {record.segments.map((segment, segIdx) => (
                    <div
                      key={segment.name}
                      className="bg-gray-800/50 rounded-lg p-3"
                    >
                      <h5 className="text-sm font-medium text-blue-300 mb-2 capitalize">
                        {segment.name}
                      </h5>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                        {segment.metrics.map((metric, idx) => (
                          <div key={`${segment.name}-${metric.type}-${idx}`} className="text-xs">
                            <span className="text-gray-500">{metric.type}: </span>
                            <span className="text-white">
                              {metric.value} {metric.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <pre className="bg-gray-900/70 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto max-h-96 overflow-y-auto">
              {JSON.stringify(record, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
