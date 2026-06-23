'use client';

import { useState, useRef, useEffect } from 'react';
import { History, ChevronDown, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { HistoryEntry, SERVICES } from '@/types';

interface HistoryDropdownProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
  currentEntryId?: string;
}

export default function HistoryDropdown({
  history,
  onSelect,
  onClear,
  currentEntryId,
}: HistoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getServiceName = (serviceType: string) => {
    const service = SERVICES.find(s => s.id === serviceType);
    return service?.name || serviceType;
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm text-gray-300"
      >
        <History className="w-4 h-4" />
        <span>History</span>
        <span className="bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded text-xs">
          {history.length}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-blue-500/30 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-blue-500/20 bg-gray-800/50">
            <span className="text-sm font-medium text-gray-300">Request History</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
                setIsOpen(false);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>

          {/* History List */}
          <div className="max-h-64 overflow-y-auto">
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => {
                  onSelect(entry);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 flex items-start gap-3 hover:bg-gray-800/50 transition-colors text-left ${
                  currentEntryId === entry.id ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''
                }`}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {entry.response.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>

                {/* Entry Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">
                      {getServiceName(entry.serviceType)}
                    </span>
                    {entry.response.data && (
                      <span className="text-xs text-gray-500">
                        {entry.response.data.length} records
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(entry.timestamp)}</span>
                    {entry.response.requestDuration && (
                      <span className="text-gray-600">
                        ({entry.response.requestDuration}ms)
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
