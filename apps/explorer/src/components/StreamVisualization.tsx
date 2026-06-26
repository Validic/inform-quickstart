'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Code2,
  BarChart2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ConfigValues, ApiSetup } from '@/types';

const RAW_EVENT_CAP = 10000;
const TILE_EXPAND_LIMIT = 50;

interface RawEvent {
  id: number;
  timestamp: Date;
  eventType: string;
  dataType: string;
  source: string;
  data: unknown;
}

interface GroupedStat {
  eventType: string;
  dataType: string;
  source: string;
  count: number;
  lastSeen: Date;
}

interface DisplayStat {
  key: string;
  label: string;
  sublabel: string;
  count: number;
  lastSeen: Date;
  eventType: string;
}

interface ExpandedTile {
  key: string;
  label: string;
  filterEventType: string;
  filterDataType?: string;
  filterGroupKey?: string;
  filterGroupMode?: GroupByMode;
}

interface StreamVisualizationProps {
  config: ConfigValues;
  setup: ApiSetup;
  isActive: boolean;
  onStop: () => void;
  apiBaseUrl?: string;
}

type GroupByMode = 'source' | 'dataType';
type ViewMode = 'visual' | 'json';

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
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [rawEvents, setRawEvents] = useState<RawEvent[]>([]);
  const [expandedTile, setExpandedTile] = useState<ExpandedTile | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const eventCounterRef = useRef(0);

  useEffect(() => {
    if (!startTime || !isConnected) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isConnected]);

  // Close expanded tile when groupBy changes since keys change meaning
  useEffect(() => {
    setExpandedTile(null);
  }, [groupBy]);

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

  const addRawEvent = useCallback((eventType: string, dataType: string, source: string, data: unknown) => {
    const id = ++eventCounterRef.current;
    setRawEvents((prev) => {
      const next = [...prev, { id, timestamp: new Date(), eventType, dataType, source, data }];
      return next.length > RAW_EVENT_CAP ? next.slice(next.length - RAW_EVENT_CAP) : next;
    });
  }, []);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setError(null);
    setGroupedStats(new Map());
    setTotalEventCount(0);
    setRawEvents([]);
    setExpandedTile(null);
    setStartTime(new Date());
    setElapsedTime(0);
    eventCounterRef.current = 0;

    let streamUrl = `${apiBaseUrl || ''}/api/stream?token=${encodeURIComponent(config.authToken)}&streamsUrl=${encodeURIComponent(config.streamsUrl)}`;
    if (setup.replayDate) {
      streamUrl += `&date=${setup.replayDate}`;
    }

    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      updateGroupedStats('connection', 'connected', 'system');
      addRawEvent('connection', 'connected', 'system', { message: 'Stream connected' });
    };

    const handleEventData = (eventData: string, eventType: string) => {
      try {
        const data = JSON.parse(eventData);

        if (data.type === 'poke' || eventType === 'poke') {
          updateGroupedStats('poke', 'heartbeat', 'system');
          addRawEvent('poke', 'heartbeat', 'system', data);
          return;
        }

        const dataType = data.type || data.resource || 'unknown';
        const source = typeof data.source === 'string'
          ? data.source
          : data.source?.type || 'unknown';

        updateGroupedStats('data', dataType, source);
        addRawEvent('data', dataType, source, data);
      } catch {
        updateGroupedStats('data', 'raw', 'unknown');
        addRawEvent('data', 'raw', 'unknown', eventData);
      }
    };

    eventSource.onmessage = (event) => {
      handleEventData(event.data, 'message');
    };

    eventSource.addEventListener('data', (event) => {
      handleEventData((event as MessageEvent).data, 'data');
    });

    eventSource.addEventListener('poke', (event) => {
      handleEventData((event as MessageEvent).data || '{}', 'poke');
    });

    eventSource.addEventListener('rule', (event) => {
      handleEventData((event as MessageEvent).data, 'rule');
    });

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        setIsConnected(false);
        setError('Connection closed. The stream may have ended.');
        updateGroupedStats('connection', 'disconnected', 'system');
        addRawEvent('connection', 'disconnected', 'system', { message: 'Stream disconnected' });
      }
    };
  }, [config.authToken, config.streamsUrl, setup.replayDate, updateGroupedStats, addRawEvent, apiBaseUrl]);

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
    setRawEvents([]);
    setExpandedTile(null);
    eventCounterRef.current = 0;
  };

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

  const formatTimestamp = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'poke': return 'border-yellow-500/30 bg-yellow-500/10';
      case 'data': return 'border-green-500/30 bg-green-500/10';
      case 'connection': return 'border-blue-500/30 bg-blue-500/10';
      default: return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const getEventTypeTextColor = (eventType: string) => {
    switch (eventType) {
      case 'poke': return 'text-yellow-400';
      case 'data': return 'text-green-400';
      case 'connection': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getEventTypeBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'poke': return 'bg-yellow-500/20 text-yellow-400';
      case 'data': return 'bg-green-500/20 text-green-400';
      case 'connection': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getSourceIcon = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('bluetooth') || s.includes('bt')) return <Smartphone className="w-5 h-5" />;
    if (s.includes('watch') || s.includes('garmin') || s.includes('fitbit') || s.includes('apple')) return <Watch className="w-5 h-5" />;
    if (s.includes('health') || s.includes('connect')) return <Activity className="w-5 h-5" />;
    if (s === 'system') return <Radio className="w-5 h-5" />;
    return <Database className="w-5 h-5" />;
  };

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType.toLowerCase()) {
      case 'summary':
      case 'summaries': return <Activity className="w-4 h-4" />;
      case 'workout':
      case 'workouts': return <Zap className="w-4 h-4" />;
      case 'measurement':
      case 'measurements': return <Database className="w-4 h-4" />;
      case 'heartbeat': return <Heart className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const sortedStats = Array.from(groupedStats.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.lastSeen.getTime() - a.lastSeen.getTime();
  });

  const pokeCount = sortedStats.filter((s) => s.eventType === 'poke').reduce((sum, s) => sum + s.count, 0);
  const dataCount = sortedStats.filter((s) => s.eventType === 'data').reduce((sum, s) => sum + s.count, 0);
  const uniqueSources = new Set(sortedStats.filter((s) => s.eventType === 'data').map((s) => s.source)).size;
  const uniqueDataTypes = new Set(sortedStats.filter((s) => s.eventType === 'data').map((s) => s.dataType)).size;

  const aggregatedStats = (() => {
    const dataStats = sortedStats.filter((s) => s.eventType === 'data');
    const nonDataStats = sortedStats.filter((s) => s.eventType !== 'data');

    if (groupBy === 'source') {
      const bySource = new Map<string, { source: string; count: number; dataTypes: Set<string>; lastSeen: Date }>();
      dataStats.forEach((stat) => {
        const existing = bySource.get(stat.source);
        if (existing) {
          existing.count += stat.count;
          existing.dataTypes.add(stat.dataType);
          if (stat.lastSeen > existing.lastSeen) existing.lastSeen = stat.lastSeen;
        } else {
          bySource.set(stat.source, { source: stat.source, count: stat.count, dataTypes: new Set([stat.dataType]), lastSeen: stat.lastSeen });
        }
      });
      return {
        data: Array.from(bySource.values())
          .map((s) => ({ key: s.source, label: s.source, sublabel: `${s.dataTypes.size} data type${s.dataTypes.size !== 1 ? 's' : ''}`, count: s.count, lastSeen: s.lastSeen, eventType: 'data' as const }))
          .sort((a, b) => b.count - a.count),
        nonData: nonDataStats.map((s) => ({ key: `${s.eventType}-${s.dataType}`, label: s.eventType, sublabel: s.dataType, count: s.count, lastSeen: s.lastSeen, eventType: s.eventType })),
      };
    } else {
      const byType = new Map<string, { dataType: string; count: number; sources: Set<string>; lastSeen: Date }>();
      dataStats.forEach((stat) => {
        const existing = byType.get(stat.dataType);
        if (existing) {
          existing.count += stat.count;
          existing.sources.add(stat.source);
          if (stat.lastSeen > existing.lastSeen) existing.lastSeen = stat.lastSeen;
        } else {
          byType.set(stat.dataType, { dataType: stat.dataType, count: stat.count, sources: new Set([stat.source]), lastSeen: stat.lastSeen });
        }
      });
      return {
        data: Array.from(byType.values())
          .map((s) => ({ key: s.dataType, label: s.dataType, sublabel: `${s.sources.size} source${s.sources.size !== 1 ? 's' : ''}`, count: s.count, lastSeen: s.lastSeen, eventType: 'data' as const }))
          .sort((a, b) => b.count - a.count),
        nonData: nonDataStats.map((s) => ({ key: `${s.eventType}-${s.dataType}`, label: s.eventType, sublabel: s.dataType, count: s.count, lastSeen: s.lastSeen, eventType: s.eventType })),
      };
    }
  })();

  const displayStats: DisplayStat[] = [...aggregatedStats.data, ...aggregatedStats.nonData];

  const handleTileClick = (stat: DisplayStat) => {
    if (expandedTile?.key === stat.key) {
      setExpandedTile(null);
      return;
    }
    if (stat.eventType === 'data') {
      setExpandedTile({ key: stat.key, label: stat.label, filterEventType: 'data', filterGroupKey: stat.label, filterGroupMode: groupBy });
    } else {
      setExpandedTile({ key: stat.key, label: stat.label, filterEventType: stat.eventType, filterDataType: stat.sublabel });
    }
  };

  const expandedEvents = useMemo(() => {
    if (!expandedTile) return [];
    return rawEvents
      .filter((e) => {
        if (expandedTile.filterEventType === 'data') {
          if (expandedTile.filterGroupMode === 'source') return e.eventType === 'data' && e.source === expandedTile.filterGroupKey;
          return e.eventType === 'data' && e.dataType === expandedTile.filterGroupKey;
        }
        return e.eventType === expandedTile.filterEventType && e.dataType === expandedTile.filterDataType;
      })
      .slice(-TILE_EXPAND_LIMIT)
      .reverse();
  }, [expandedTile, rawEvents]);

  const expandedTotalCount = useMemo(() => {
    if (!expandedTile) return 0;
    return rawEvents.filter((e) => {
      if (expandedTile.filterEventType === 'data') {
        if (expandedTile.filterGroupMode === 'source') return e.eventType === 'data' && e.source === expandedTile.filterGroupKey;
        return e.eventType === 'data' && e.dataType === expandedTile.filterGroupKey;
      }
      return e.eventType === expandedTile.filterEventType && e.dataType === expandedTile.filterDataType;
    }).length;
  }, [expandedTile, rawEvents]);

  const jsonViewEvents = [...rawEvents].reverse();

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
                <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded">LIVE</span>
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

        <div className="flex items-center gap-2">
          <button onClick={clearStats} className="p-2 rounded hover:bg-gray-700/50 transition-colors" title="Clear stats">
            <Trash2 className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={disconnect} className="p-2 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors" title="Disconnect">
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

      {/* View mode + group-by controls */}
      <div className="flex items-center justify-between mb-3">
        {/* View mode tabs */}
        <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
          <button
            onClick={() => setViewMode('visual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              viewMode === 'visual' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Visual
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              viewMode === 'json' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            JSON
          </button>
        </div>

        {/* Group-by toggle (visual mode only) */}
        {viewMode === 'visual' && (
          <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={() => setGroupBy('source')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                groupBy === 'source' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Source
            </button>
            <button
              onClick={() => setGroupBy('dataType')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                groupBy === 'dataType' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Data Type
            </button>
          </div>
        )}

        {/* JSON view event count */}
        {viewMode === 'json' && rawEvents.length > 0 && (
          <span className="text-xs text-gray-500">
            {rawEvents.length} event{rawEvents.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">

        {/* Visual view */}
        {viewMode === 'visual' && (
          <>
            {displayStats.length === 0 ? (
              <div className="bg-gray-900/50 rounded-lg p-8 text-gray-500 text-center">
                <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Waiting for stream events...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayStats.map((stat) => {
                    const isExpanded = expandedTile?.key === stat.key;
                    return (
                      <button
                        key={stat.key}
                        onClick={() => handleTileClick(stat)}
                        className={`rounded-lg p-4 border transition-all text-left w-full cursor-pointer ${getEventTypeColor(stat.eventType)} ${
                          isExpanded ? 'ring-2 ring-blue-400/50' : 'hover:brightness-125'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className={getEventTypeTextColor(stat.eventType)}>
                              {groupBy === 'source' ? getSourceIcon(stat.label) : getDataTypeIcon(stat.label)}
                            </span>
                            <div>
                              <div className="text-white text-sm font-medium capitalize">{stat.label}</div>
                              <div className="text-sm text-gray-500 mt-0.5">{stat.sublabel}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className={`text-2xl font-bold ${getEventTypeTextColor(stat.eventType)}`}>
                              {stat.count.toLocaleString()}
                            </div>
                            {isExpanded
                              ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                              : <ChevronDown className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100" />
                            }
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Expanded tile event panel */}
                {expandedTile && (
                  <div className="mt-4 rounded-lg border border-gray-700 bg-gray-900/70">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getEventTypeBadgeColor(expandedTile.filterEventType)}`}>
                          {expandedTile.filterEventType}
                        </span>
                        <span className="text-sm font-medium text-white capitalize">{expandedTile.label}</span>
                        <span className="text-xs text-gray-500">
                          {expandedTotalCount > TILE_EXPAND_LIMIT
                            ? `last ${expandedEvents.length} of ${expandedTotalCount} events`
                            : `${expandedEvents.length} event${expandedEvents.length !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                      <button
                        onClick={() => setExpandedTile(null)}
                        className="p-1 rounded hover:bg-gray-700/50 transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="divide-y divide-gray-800 max-h-80 overflow-y-auto">
                      {expandedEvents.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No events captured yet</div>
                      ) : (
                        expandedEvents.map((event) => (
                          <div key={event.id} className="px-4 py-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${getEventTypeBadgeColor(event.eventType)}`}>
                                {event.eventType}
                              </span>
                              {event.dataType !== event.eventType && (
                                <span className="text-xs text-gray-500">{event.dataType}</span>
                              )}
                              <span className="text-xs text-gray-600 ml-auto font-mono">{formatTimestamp(event.timestamp)}</span>
                            </div>
                            <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap break-words font-mono leading-relaxed">
                              {JSON.stringify(event.data, null, 2)}
                            </pre>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* JSON view */}
        {viewMode === 'json' && (
          <>
            {jsonViewEvents.length === 0 ? (
              <div className="bg-gray-900/50 rounded-lg p-8 text-gray-500 text-center">
                <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Waiting for stream events...</p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-700 bg-gray-900/70 divide-y divide-gray-800">
                {jsonViewEvents.map((event) => (
                  <div key={event.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getEventTypeBadgeColor(event.eventType)}`}>
                        {event.eventType}
                      </span>
                      {event.dataType !== event.eventType && (
                        <span className="text-xs text-gray-400">{event.dataType}</span>
                      )}
                      <span className="text-xs text-gray-500">{event.source !== 'system' ? event.source : ''}</span>
                      <span className="text-xs text-gray-600 ml-auto font-mono">{formatTimestamp(event.timestamp)}</span>
                    </div>
                    <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap break-words font-mono leading-relaxed">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
