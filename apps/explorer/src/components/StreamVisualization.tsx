'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio,
  Activity,
  Clock,
  Zap,
  Database,
  Heart,
  Smartphone,
  Watch,
  XCircle,
  Trash2,
  Layers,
  GitBranch,
} from 'lucide-react';
import { ConfigValues, ApiSetup } from '@/types';

interface GroupedStat {
  eventType: string;
  dataType: string;
  source: string;
  count: number;
  lastSeen: Date;
}

interface StreamVisualizationProps {
  config: ConfigValues;
  setup: ApiSetup;
  isActive: boolean;
  onStop: () => void;
  apiBaseUrl?: string;
}

type GroupByMode = 'source' | 'dataType';

export default function StreamVisualization({
  config,
  setup,
  isActive,
  onStop,
  apiBaseUrl,
}: StreamVisualizationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [groupedStats, setGroupedStats] = useState<Map<string, GroupedStat>>(new Map());
  const [totalEventCount, setTotalEventCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [groupBy, setGroupBy] = useState<GroupByMode>('source');
  const eventSourceRef = useRef<EventSource | null>(null);

  // Update elapsed time
  useEffect(() => {
    if (!startTime || !isConnected) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isConnected]);

  // Helper to update grouped stats
  const updateGroupedStats = useCallback((eventType: string, dataType: string, source: string) => {
    const key = `${eventType}|${dataType}|${source}`;
    setGroupedStats((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(key);
      if (existing) {
        newMap.set(key, { ...existing, count: existing.count + 1, lastSeen: new Date() });
      } else {
        newMap.set(key, { eventType, dataType, source, count: 1, lastSeen: new Date() });
      }
      return newMap;
    });
    setTotalEventCount((prev) => prev + 1);
  }, []);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setError(null);
    setGroupedStats(new Map());
    setTotalEventCount(0);
    setStartTime(new Date());
    setElapsedTime(0);

    let streamUrl = `${apiBaseUrl || ''}/api/stream?token=${encodeURIComponent(config.authToken)}`;
    if (setup.replayDate) {
      streamUrl += `&date=${setup.replayDate}`;
    }

    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      updateGroupedStats('connection', 'connected', 'system');
    };

    // Handler for processing SSE data
    const handleEventData = (eventData: string, eventType: string) => {
      try {
        const data = JSON.parse(eventData);

        // Handle poke events
        if (data.type === 'poke' || eventType === 'poke') {
          updateGroupedStats('poke', 'heartbeat', 'system');
          return;
        }

        // Handle data events
        const dataType = data.type || data.resource || 'unknown';
        const source = typeof data.source === 'string'
          ? data.source
          : data.source?.type || 'unknown';

        updateGroupedStats('data', dataType, source);
      } catch {
        // Raw text event
        updateGroupedStats('data', 'raw', 'unknown');
      }
    };

    // Listen for default messages (unnamed events)
    eventSource.onmessage = (event) => {
      handleEventData(event.data, 'message');
    };

    // Listen for named 'data' events (Validic uses this)
    eventSource.addEventListener('data', (event) => {
      handleEventData((event as MessageEvent).data, 'data');
    });

    // Listen for 'poke' events (heartbeats)
    eventSource.addEventListener('poke', (event) => {
      handleEventData((event as MessageEvent).data || '{}', 'poke');
    });

    // Listen for 'rule' events
    eventSource.addEventListener('rule', (event) => {
      handleEventData((event as MessageEvent).data, 'rule');
    });

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        setIsConnected(false);
        setError('Connection closed. The stream may have ended.');
        updateGroupedStats('connection', 'disconnected', 'system');
      }
    };
  }, [config.authToken, setup.replayDate, updateGroupedStats, apiBaseUrl]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    onStop();
  }, [onStop]);

  const clearStats = () => {
    setGroupedStats(new Map());
    setTotalEventCount(0);
  };

  // Connect when component becomes active
  useEffect(() => {
    if (isActive && !eventSourceRef.current) {
      connect();
    }
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
    // Only reconnect when isActive changes, not when connect function reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'poke':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'data':
        return 'border-green-500/30 bg-green-500/10';
      case 'connection':
        return 'border-blue-500/30 bg-blue-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const getEventTypeTextColor = (eventType: string) => {
    switch (eventType) {
      case 'poke':
        return 'text-yellow-400';
      case 'data':
        return 'text-green-400';
      case 'connection':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getSourceIcon = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('bluetooth') || s.includes('bt')) {
      return <Smartphone className="w-5 h-5" />;
    }
    if (s.includes('watch') || s.includes('garmin') || s.includes('fitbit') || s.includes('apple')) {
      return <Watch className="w-5 h-5" />;
    }
    if (s.includes('health') || s.includes('connect')) {
      return <Activity className="w-5 h-5" />;
    }
    if (s === 'system') {
      return <Radio className="w-5 h-5" />;
    }
    return <Database className="w-5 h-5" />;
  };

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType.toLowerCase()) {
      case 'summary':
      case 'summaries':
        return <Activity className="w-4 h-4" />;
      case 'workout':
      case 'workouts':
        return <Zap className="w-4 h-4" />;
      case 'measurement':
      case 'measurements':
        return <Database className="w-4 h-4" />;
      case 'heartbeat':
        return <Heart className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  // Convert Map to sorted array for rendering
  const sortedStats = Array.from(groupedStats.values()).sort((a, b) => {
    // Sort by count descending, then by lastSeen
    if (b.count !== a.count) return b.count - a.count;
    return b.lastSeen.getTime() - a.lastSeen.getTime();
  });

  // Calculate summary stats
  const pokeCount = sortedStats
    .filter((s) => s.eventType === 'poke')
    .reduce((sum, s) => sum + s.count, 0);
  const dataCount = sortedStats
    .filter((s) => s.eventType === 'data')
    .reduce((sum, s) => sum + s.count, 0);
  const uniqueSources = new Set(sortedStats.filter((s) => s.eventType === 'data').map((s) => s.source)).size;
  const uniqueDataTypes = new Set(sortedStats.filter((s) => s.eventType === 'data').map((s) => s.dataType)).size;

  // Group stats by selected mode (aggregate counts)
  const aggregatedStats = (() => {
    const dataStats = sortedStats.filter((s) => s.eventType === 'data');
    const nonDataStats = sortedStats.filter((s) => s.eventType !== 'data');

    if (groupBy === 'source') {
      // Group by source - aggregate all data types for each source
      const bySource = new Map<string, { source: string; count: number; dataTypes: Set<string>; lastSeen: Date }>();
      dataStats.forEach((stat) => {
        const existing = bySource.get(stat.source);
        if (existing) {
          existing.count += stat.count;
          existing.dataTypes.add(stat.dataType);
          if (stat.lastSeen > existing.lastSeen) existing.lastSeen = stat.lastSeen;
        } else {
          bySource.set(stat.source, {
            source: stat.source,
            count: stat.count,
            dataTypes: new Set([stat.dataType]),
            lastSeen: stat.lastSeen,
          });
        }
      });
      return {
        data: Array.from(bySource.values())
          .map((s) => ({
            key: s.source,
            label: s.source,
            sublabel: `${s.dataTypes.size} data type${s.dataTypes.size !== 1 ? 's' : ''}`,
            count: s.count,
            lastSeen: s.lastSeen,
            eventType: 'data' as const,
          }))
          .sort((a, b) => b.count - a.count),
        nonData: nonDataStats.map((s) => ({
          key: `${s.eventType}-${s.dataType}`,
          label: s.eventType,
          sublabel: s.dataType,
          count: s.count,
          lastSeen: s.lastSeen,
          eventType: s.eventType,
        })),
      };
    } else {
      // Group by dataType - aggregate all sources for each data type
      const byType = new Map<string, { dataType: string; count: number; sources: Set<string>; lastSeen: Date }>();
      dataStats.forEach((stat) => {
        const existing = byType.get(stat.dataType);
        if (existing) {
          existing.count += stat.count;
          existing.sources.add(stat.source);
          if (stat.lastSeen > existing.lastSeen) existing.lastSeen = stat.lastSeen;
        } else {
          byType.set(stat.dataType, {
            dataType: stat.dataType,
            count: stat.count,
            sources: new Set([stat.source]),
            lastSeen: stat.lastSeen,
          });
        }
      });
      return {
        data: Array.from(byType.values())
          .map((s) => ({
            key: s.dataType,
            label: s.dataType,
            sublabel: `${s.sources.size} source${s.sources.size !== 1 ? 's' : ''}`,
            count: s.count,
            lastSeen: s.lastSeen,
            eventType: 'data' as const,
          }))
          .sort((a, b) => b.count - a.count),
        nonData: nonDataStats.map((s) => ({
          key: `${s.eventType}-${s.dataType}`,
          label: s.eventType,
          sublabel: s.dataType,
          count: s.count,
          lastSeen: s.lastSeen,
          eventType: s.eventType,
        })),
      };
    }
  })();

  const displayStats = [...aggregatedStats.data, ...aggregatedStats.nonData];

  return (
    <div className="h-full flex flex-col">
      {/* Stream Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-blue-500/20">
        <div className="flex items-center gap-3">
          <div className={`relative ${isConnected ? 'animate-pulse' : ''}`}>
            <Radio className={`w-6 h-6 ${isConnected ? 'text-green-500' : 'text-gray-500'}`} />
            {isConnected && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-white flex items-center gap-2">
              Stream {isConnected ? 'Connected' : 'Disconnected'}
              {isConnected && (
                <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
                  LIVE
                </span>
              )}
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatElapsedTime(elapsedTime)}
              </span>
              <span>{totalEventCount} total events</span>
            </div>
          </div>
        </div>

        {/* Stream Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearStats}
            className="p-2 rounded hover:bg-gray-700/50 transition-colors"
            title="Clear stats"
          >
            <Trash2 className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={disconnect}
            className="p-2 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors"
            title="Disconnect"
          >
            <XCircle className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{totalEventCount}</div>
          <div className="text-sm text-gray-500">Total Events</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{dataCount}</div>
          <div className="text-sm text-gray-500">Data Records</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{pokeCount}</div>
          <div className="text-sm text-gray-500">Heartbeats</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{uniqueSources}</div>
          <div className="text-sm text-gray-500">Sources</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-cyan-400">{uniqueDataTypes}</div>
          <div className="text-sm text-gray-500">Data Types</div>
        </div>
      </div>

      {/* Grouped Stats Cards */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-400">
            Group by {groupBy === 'source' ? 'Source' : 'Data Type'}
          </h4>
          {/* Toggle */}
          <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={() => setGroupBy('source')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                groupBy === 'source'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Source
            </button>
            <button
              onClick={() => setGroupBy('dataType')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                groupBy === 'dataType'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Data Type
            </button>
          </div>
        </div>
        {displayStats.length === 0 ? (
          <div className="bg-gray-900/50 rounded-lg p-8 text-gray-500 text-center">
            <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Waiting for stream events...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {displayStats.map((stat) => (
              <div
                key={stat.key}
                className={`rounded-lg p-4 border transition-all ${getEventTypeColor(stat.eventType)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={getEventTypeTextColor(stat.eventType)}>
                      {groupBy === 'source' ? getSourceIcon(stat.label) : getDataTypeIcon(stat.label)}
                    </span>
                    <div>
                      <div className="text-white text-sm font-medium capitalize">
                        {stat.label}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        {stat.sublabel}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getEventTypeTextColor(stat.eventType)}`}>
                      {stat.count.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
