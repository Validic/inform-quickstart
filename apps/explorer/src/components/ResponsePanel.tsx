'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Code,
  LayoutGrid,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ApiResponse, DataRecord, HistoryEntry, PaginationSummary } from '@/types';
import { obfuscateSensitiveData } from '@/lib/obfuscate';
import DataRecordCard from './DataRecordCard';
import DataTypeGroupCard from './DataTypeGroupCard';
import UserCard from './UserCard';
import HistoryDropdown from './HistoryDropdown';

interface ResponsePanelProps {
  response: ApiResponse | null;
  isLoading: boolean;
  history: HistoryEntry[];
  onHistorySelect: (entry: HistoryEntry) => void;
  onHistoryClear: () => void;
  currentHistoryId?: string;
  // Pagination controls for get-users
  onNextPage?: () => void;
  onPrevPage?: () => void;
  isPaginating?: boolean;
}

export default function ResponsePanel({
  response,
  isLoading,
  history,
  onHistorySelect,
  onHistoryClear,
  currentHistoryId,
  onNextPage,
  onPrevPage,
  isPaginating,
}: ResponsePanelProps) {
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const [copied, setCopied] = useState(false);

  const handleCopyJson = async () => {
    if (!response) return;
    await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-gray-400">Fetching data...</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full flex flex-col">
        {/* History dropdown when no response */}
        {history.length > 0 && (
          <div className="flex justify-end mb-4 pb-4 border-b border-blue-500/20">
            <HistoryDropdown
              history={history}
              onSelect={onHistorySelect}
              onClear={onHistoryClear}
              currentEntryId={currentHistoryId}
            />
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white mb-2">No Data Yet</h3>
            <p className="text-gray-400 text-sm">
              Configure your request parameters and click Execute to see the API response displayed here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Response Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-blue-500/20">
        <div className="flex items-center gap-3">
          {response.success ? (
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          ) : (
            <XCircle className="w-6 h-6 text-red-500" />
          )}
          <div>
            <h3 className="font-medium text-white">
              {response.success ? 'Request Successful' : 'Request Failed'}
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(response.timestamp).toLocaleTimeString()}
              </span>
              {response.requestDuration && (
                <span>{response.requestDuration}ms</span>
              )}
              {response.data && (
                <span>{response.data.length} records</span>
              )}
              {response.dataByType && (
                <span>
                  {response.dataByType.reduce((sum, g) => sum + g.recordCount, 0)} records across {response.dataByType.length} types
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View Toggle and History */}
        <div className="flex items-center gap-3">
          <HistoryDropdown
            history={history}
            onSelect={onHistorySelect}
            onClear={onHistoryClear}
            currentEntryId={currentHistoryId}
          />
          <button
            onClick={handleCopyJson}
            className="p-1.5 rounded hover:bg-gray-700/50 transition-colors"
            title="Copy JSON"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-colors ${
                viewMode === 'visual'
                  ? 'bg-blue-500/30 text-blue-300'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Visual
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-colors ${
                viewMode === 'json'
                  ? 'bg-blue-500/30 text-blue-300'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {!response.success && response.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
          <p className="text-red-400">{response.error}</p>
        </div>
      )}

      {/* Response Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'visual' ? (
          (() => {
            // Handle grouped data by type (All Data query)
            if (response.dataByType) {
              // Sort groups so ones with data appear first (top/left)
              const sortedGroups = [...response.dataByType].sort((a, b) => {
                if (a.recordCount > 0 && b.recordCount === 0) return -1;
                if (a.recordCount === 0 && b.recordCount > 0) return 1;
                return 0;
              });

              // Split into two columns for independent expansion
              const leftColumn = sortedGroups.filter((_, i) => i % 2 === 0);
              const rightColumn = sortedGroups.filter((_, i) => i % 2 === 1);

              return (
                <div className="flex gap-4">
                  {/* Left column */}
                  <div className="flex-1 space-y-4">
                    {leftColumn.map((group) => (
                      <DataTypeGroupCard
                        key={group.dataType}
                        group={group}
                      />
                    ))}
                  </div>
                  {/* Right column */}
                  <div className="flex-1 space-y-4">
                    {rightColumn.map((group) => (
                      <DataTypeGroupCard
                        key={group.dataType}
                        group={group}
                      />
                    ))}
                  </div>
                </div>
              );
            }

            // Handle regular data response
            if (response.data) {
              // Check if all records are user records
              const hasUsers = response.data.some(r => r.uid !== undefined && (r.marketplace || r.mobile));

              if (hasUsers) {
                const pagination = response.pagination;
                // Calculate display range for page-based pagination
                // page 0 = records 1-limit, page 1 = records (limit+1)-(2*limit), etc.
                const startRecord = pagination ? (pagination.page * pagination.limit) + 1 : 1;
                const endRecord = pagination ? startRecord + pagination.recordsOnPage - 1 : response.data.length;

                // Grid layout for users with pagination
                return (
                  <div className="space-y-4">
                    {/* Pagination Header */}
                    {pagination && (
                      <div className="flex items-center justify-between px-2 py-2 bg-gray-800/50 rounded-lg">
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {pagination.total !== undefined ? (
                            <span>
                              Showing {startRecord}-{endRecord} of {pagination.total} users
                            </span>
                          ) : (
                            <span>
                              Showing {startRecord}-{endRecord} users (page {pagination.page + 1})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={onPrevPage}
                            disabled={pagination.page === 0 || isPaginating}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              pagination.page === 0 || isPaginating
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-blue-400 hover:bg-blue-500/20'
                            }`}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </button>
                          <button
                            onClick={onNextPage}
                            disabled={!pagination.hasMore || isPaginating}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              !pagination.hasMore || isPaginating
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-blue-400 hover:bg-blue-500/20'
                            }`}
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                            {isPaginating && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Users Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {response.data.map((record, index) => (
                        <UserCard
                          key={record.id || `user-${index}`}
                          user={record}
                          index={index}
                        />
                      ))}
                    </div>

                    {/* Pagination Footer (for long lists) */}
                    {pagination && response.data.length > 4 && (
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          onClick={onPrevPage}
                          disabled={pagination.page === 0 || isPaginating}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            pagination.page === 0 || isPaginating
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-blue-400 hover:bg-blue-500/20'
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </button>
                        <span className="text-sm px-3" style={{ color: 'var(--text-muted)' }}>
                          Page {pagination.page + 1}
                          {pagination.total !== undefined && ` of ${Math.ceil(pagination.total / pagination.limit)}`}
                        </span>
                        <button
                          onClick={onNextPage}
                          disabled={!pagination.hasMore || isPaginating}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            !pagination.hasMore || isPaginating
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-blue-400 hover:bg-blue-500/20'
                          }`}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // List layout for data records
              return (
                <div className="space-y-4">
                  {response.data.map((record, index) => (
                    <DataRecordCard
                      key={record.id || `record-${index}`}
                      record={record}
                      index={index}
                    />
                  ))}
                </div>
              );
            }

            return null;
          })()
        ) : (
          <pre className="bg-gray-900/50 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
            {JSON.stringify(obfuscateSensitiveData(response), null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
