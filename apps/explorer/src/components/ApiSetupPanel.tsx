'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Users,
  Calendar,
  Database,
  Activity,
  Play,
  Loader2,
  ArrowUpDown,
} from 'lucide-react';
import { ApiSetup, ServiceType, DATA_TYPES, DEVICE_TYPES, ConfigValues, getUserNameById } from '@/types';
import { useConfig } from '@/context/ConfigContext';
import ServiceSelector from './ServiceSelector';
import RequestPreview from './RequestPreview';

interface ApiSetupPanelProps {
  setup: ApiSetup;
  onChange: (setup: ApiSetup) => void;
  selectedService: ServiceType;
  onServiceChange: (service: ServiceType) => void;
  onExecute: () => void;
  isLoading: boolean;
  config: ConfigValues;
  onRequestBodyChange?: (body: string) => void;
  requestBody?: string;
  onFetchAllUsers?: () => void;
  isFetchingAllUsers?: boolean;
}

export default function ApiSetupPanel({
  setup,
  onChange,
  selectedService,
  onServiceChange,
  onExecute,
  isLoading,
  config,
  onFetchAllUsers,
  isFetchingAllUsers,
}: ApiSetupPanelProps) {
  const { users } = useConfig();
  const [availableSources, setAvailableSources] = useState<string[]>([]);

  const isGenerateData = selectedService === 'generate-data';
  const isGetUserData = selectedService === 'get-user-data';
  const isGetUser = selectedService === 'get-user';
  const isGetUsers = selectedService === 'get-users';
  const isReplayStream = selectedService === 'replay-stream';
  const showDeviceType = setup.dataType === 'measurements';
  const showSegments = setup.dataType === 'nutrition';

  useEffect(() => {
    const dataType = DATA_TYPES.find((dt) => dt.value === setup.dataType);
    if (dataType) {
      setAvailableSources(dataType.sources);
      // For generate-data, source is required - default to first option
      if (isGenerateData && !dataType.sources.includes(setup.source)) {
        onChange({ ...setup, source: dataType.sources[0] || '' });
      }
    }
  }, [setup.dataType, isGenerateData]);

  const handleChange = (field: keyof ApiSetup, value: string | boolean | number) => {
    // Sanitize date fields to ensure YYYY-MM-DD format
    if ((field === 'startDate' || field === 'endDate' || field === 'replayDate') && typeof value === 'string') {
      // If value contains 'T', extract just the date part
      if (value.includes('T')) {
        value = value.split('T')[0];
      }
    }
    onChange({ ...setup, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Service Selector */}
      <ServiceSelector
        selectedService={selectedService}
        onSelect={onServiceChange}
      />

      {/* Divider */}
      <div className="border-t border-blue-500/20" />

      {/* Sort Order - for get-users */}
      {isGetUsers && (
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <ArrowUpDown className="w-4 h-4" />
            Sort Order
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleChange('usersSortOrder', 'desc')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                (setup.usersSortOrder || 'desc') === 'desc'
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-600 hover:border-gray-500'
              }`}
            >
              Newest First
            </button>
            <button
              type="button"
              onClick={() => handleChange('usersSortOrder', 'asc')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                setup.usersSortOrder === 'asc'
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-600 hover:border-gray-500'
              }`}
            >
              Oldest First
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Sort users by creation date
          </p>

          {/* Fetch All Users Button */}
          {onFetchAllUsers && (
            <button
              onClick={onFetchAllUsers}
              disabled={isFetchingAllUsers || isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetchingAllUsers ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fetching All Users...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Fetch All Users
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* User ID - for get-user, get-user-data, generate-data */}
      {(isGetUser || isGetUserData || isGenerateData) && (
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <User className="w-4 h-4" />
            User
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={setup.userId}
              onChange={(e) => handleChange('userId', e.target.value)}
              placeholder={users.length > 0 ? "Enter user ID or select from list" : "Enter user ID"}
              className="w-full"
            />
            {users.length > 0 && (
              <select
                value={setup.userId}
                onChange={(e) => handleChange('userId', e.target.value)}
                className="w-full"
              >
                <option value="">-- Select a user --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            )}
            {setup.userId && getUserNameById(setup.userId, users) && (
              <p className="text-xs text-blue-400">
                Selected: {getUserNameById(setup.userId, users)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Date Range - for get-user-data and generate-data */}
      {(isGetUserData || isGenerateData) && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Calendar className="w-4 h-4" />
              Start Date
            </label>
            <input
              type="date"
              value={setup.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Calendar className="w-4 h-4" />
              End Date
            </label>
            <input
              type="date"
              value={setup.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Replay Stream Date (optional) */}
      {isReplayStream && (
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Calendar className="w-4 h-4" />
            Date
            <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="date"
            value={setup.replayDate || ''}
            onChange={(e) => handleChange('replayDate', e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Filter replay to a specific date
          </p>
        </div>
      )}

      {/* Data Type Selection */}
      {(isGenerateData || isGetUserData) && (
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Database className="w-4 h-4" />
            Data Type
            {isGetUserData && <span className="text-gray-500">(optional)</span>}
          </label>
          <select
            value={setup.dataType}
            onChange={(e) => handleChange('dataType', e.target.value)}
            className="w-full"
          >
            {isGetUserData && (
              <option value="">All Data</option>
            )}
            {DATA_TYPES.map((dt) => (
              <option key={dt.value} value={dt.value}>
                {dt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Source Selection - only for generate-data */}
      {isGenerateData && (
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Activity className="w-4 h-4" />
            Data Source
          </label>
          <select
            value={setup.source}
            onChange={(e) => handleChange('source', e.target.value)}
            className="w-full"
          >
            {availableSources.map((source) => (
              <option key={source} value={source}>
                {source.charAt(0).toUpperCase() + source.slice(1).replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Device Type (for measurements) */}
      {showDeviceType && isGenerateData && (
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Activity className="w-4 h-4" />
            Device Type
          </label>
          <select
            value={setup.deviceType || ''}
            onChange={(e) => handleChange('deviceType', e.target.value)}
            className="w-full"
          >
            <option value="">Random (System Chooses)</option>
            {DEVICE_TYPES.map((dt) => (
              <option key={dt} value={dt}>
                {dt.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Include Segments (for nutrition) */}
      {showSegments && isGenerateData && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="includeSegments"
            checked={setup.includeSegments || false}
            onChange={(e) => handleChange('includeSegments', e.target.checked)}
            className="w-4 h-4 rounded bg-gray-800 border-blue-500/30"
          />
          <label htmlFor="includeSegments" className="text-sm text-gray-400">
            Include meal segments (breakfast, lunch, dinner, snack)
          </label>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={onExecute}
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Executing...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Execute Request
          </>
        )}
      </button>

      {/* Request Preview */}
      <RequestPreview
        config={config}
        setup={setup}
        serviceType={selectedService}
      />
    </div>
  );
}
