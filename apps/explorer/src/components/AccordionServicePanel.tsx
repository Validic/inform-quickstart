'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  User,
  Users,
  UserPlus,
  Calendar,
  Database,
  Activity,
  Play,
  Loader2,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';
import {
  ApiSetup,
  ServiceType,
  ServiceCategory,
  SERVICE_CATEGORIES,
  SERVICES,
  DATA_TYPES,
  DEVICE_TYPES,
  ConfigValues,
  getUserNameById,
  DemoUser,
} from '@/types';
import RequestPreview from './RequestPreview';

interface AccordionServicePanelProps {
  setup: ApiSetup;
  onChange: (setup: ApiSetup) => void;
  selectedService: ServiceType;
  onServiceChange: (service: ServiceType) => void;
  onExecute: () => void;
  isLoading: boolean;
  config: ConfigValues;
  users: DemoUser[];
  onFetchAllUsers?: () => void;
  isFetchingAllUsers?: boolean;
  onRequestBodyChange?: (body: string) => void;
  requestBody?: string;
}

// Icon mapping for services
const serviceIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  'get-user': User,
  'get-users': Users,
  'create-user': UserPlus,
  'get-user-data': Database,
  'replay-stream': RefreshCw,
  'generate-data': Activity,
};

// Get service color
function getServiceColor(serviceId: ServiceType): string {
  const service = SERVICES.find(s => s.id === serviceId);
  return service?.color || '#6b7280';
}

export default function AccordionServicePanel({
  setup,
  onChange,
  selectedService,
  onServiceChange,
  onExecute,
  isLoading,
  config,
  users,
  onFetchAllUsers,
  isFetchingAllUsers,
}: AccordionServicePanelProps) {
  const [expandedService, setExpandedService] = useState<ServiceType | null>(selectedService);
  const [availableSources, setAvailableSources] = useState<string[]>([]);

  // Update available sources when data type changes
  useEffect(() => {
    const dataType = DATA_TYPES.find((dt) => dt.value === setup.dataType);
    if (dataType) {
      setAvailableSources(dataType.sources);
      // For generate-data, source is required - default to first option
      if (selectedService === 'generate-data' && !dataType.sources.includes(setup.source)) {
        onChange({ ...setup, source: dataType.sources[0] || '' });
      }
    }
  }, [setup.dataType, selectedService, setup.source, onChange]);

  const handleChange = (field: keyof ApiSetup, value: string | boolean | number) => {
    if ((field === 'startDate' || field === 'endDate' || field === 'replayDate') && typeof value === 'string') {
      if (value.includes('T')) {
        value = value.split('T')[0];
      }
    }
    onChange({ ...setup, [field]: value });
  };

  const handleServiceClick = (serviceId: ServiceType) => {
    if (expandedService === serviceId) {
      setExpandedService(null);
    } else {
      setExpandedService(serviceId);
      onServiceChange(serviceId);
    }
  };

  // Render user ID input (shared by multiple services)
  const renderUserIdInput = () => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm text-gray-400">
        <User className="w-4 h-4" />
        User
      </label>
      <input
        type="text"
        value={setup.userId}
        onChange={(e) => handleChange('userId', e.target.value)}
        placeholder={users.length > 0 ? "Enter user ID or select below" : "Enter user ID"}
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
  );

  // Render date range inputs
  const renderDateRange = () => (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
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
        <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
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
  );

  // Render data type selector
  const renderDataTypeSelector = (optional: boolean = false) => (
    <div>
      <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
        <Database className="w-4 h-4" />
        Data Type
        {optional && <span className="text-gray-500">(optional)</span>}
      </label>
      <select
        value={setup.dataType}
        onChange={(e) => handleChange('dataType', e.target.value)}
        className="w-full"
      >
        {optional && <option value="">All Data</option>}
        {DATA_TYPES.map((dt) => (
          <option key={dt.value} value={dt.value}>
            {dt.label}
          </option>
        ))}
      </select>
    </div>
  );

  // Render execute button
  const renderExecuteButton = () => (
    <button
      onClick={onExecute}
      disabled={isLoading}
      className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Executing...
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          Execute
        </>
      )}
    </button>
  );

  // Render request preview
  const renderRequestPreview = (serviceType: ServiceType) => (
    <div className="mt-4 pt-4 border-t border-gray-700/50">
      <RequestPreview
        config={config}
        setup={setup}
        serviceType={serviceType}
      />
    </div>
  );

  // Service-specific content renderers
  const renderGetUserContent = () => (
    <div className="space-y-4">
      {renderUserIdInput()}
      {renderExecuteButton()}
      {renderRequestPreview('get-user')}
    </div>
  );

  const renderGetUsersContent = () => (
    <div className="space-y-4">
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
      </div>

      {onFetchAllUsers && (
        <button
          onClick={onFetchAllUsers}
          disabled={isFetchingAllUsers || isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 disabled:opacity-50"
        >
          {isFetchingAllUsers ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Fetching...
            </>
          ) : (
            <>
              <Users className="w-4 h-4" />
              Fetch All Users
            </>
          )}
        </button>
      )}

      {renderExecuteButton()}
      {renderRequestPreview('get-users')}
    </div>
  );

  const renderCreateUserContent = () => (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <UserPlus className="w-4 h-4" />
          User ID (uid)
        </label>
        <input
          type="text"
          value={setup.userId}
          onChange={(e) => handleChange('userId', e.target.value)}
          placeholder="Leave blank to auto-generate"
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Your reference ID for this user. Must be unique within your org.
        </p>
      </div>
      {renderExecuteButton()}
      {renderRequestPreview('create-user')}
    </div>
  );

  const renderGetUserDataContent = () => (
    <div className="space-y-4">
      {renderUserIdInput()}
      {renderDateRange()}
      {renderDataTypeSelector(true)}
      {renderExecuteButton()}
      {renderRequestPreview('get-user-data')}
    </div>
  );

  const renderReplayStreamContent = () => (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <Calendar className="w-4 h-4" />
          Date <span className="text-gray-500">(optional)</span>
        </label>
        <input
          type="date"
          value={setup.replayDate || ''}
          onChange={(e) => handleChange('replayDate', e.target.value)}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">Filter replay to a specific date</p>
      </div>
      {renderExecuteButton()}
      {renderRequestPreview('replay-stream')}
    </div>
  );

  const renderGenerateDataContent = () => (
    <div className="space-y-4">
      {renderUserIdInput()}
      {renderDateRange()}
      {renderDataTypeSelector(false)}

      <div>
        <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
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

      {setup.dataType === 'measurements' && (
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
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

      {setup.dataType === 'nutrition' && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="includeSegments"
            checked={setup.includeSegments || false}
            onChange={(e) => handleChange('includeSegments', e.target.checked)}
            className="w-4 h-4 rounded bg-gray-800 border-blue-500/30"
          />
          <label htmlFor="includeSegments" className="text-sm text-gray-400">
            Include meal segments
          </label>
        </div>
      )}

      {renderExecuteButton()}
      {renderRequestPreview('generate-data')}
    </div>
  );

  // Get content renderer for a service
  const getServiceContent = (serviceType: ServiceType) => {
    switch (serviceType) {
      case 'get-user':
        return renderGetUserContent();
      case 'create-user':
        return renderCreateUserContent();
      case 'get-users':
        return renderGetUsersContent();
      case 'get-user-data':
        return renderGetUserDataContent();
      case 'replay-stream':
        return renderReplayStreamContent();
      case 'generate-data':
        return renderGenerateDataContent();
      default:
        return null;
    }
  };

  // Render a single service accordion item
  const renderServiceItem = (serviceId: ServiceType) => {
    const service = SERVICES.find(s => s.id === serviceId);
    if (!service) return null;

    const isExpanded = expandedService === serviceId;
    const Icon = serviceIcons[serviceId] || Database;
    const color = getServiceColor(serviceId);

    return (
      <div
        key={serviceId}
        className={`border rounded-lg overflow-hidden transition-all duration-200 ${
          isExpanded
            ? 'border-blue-500/50 bg-gray-800/30'
            : 'border-gray-700/50 bg-gray-800/20 hover:border-gray-600/50'
        }`}
      >
        {/* Header */}
        <button
          onClick={() => handleServiceClick(serviceId)}
          className="w-full flex items-center gap-3 p-3 text-left"
        >
          <div
            className="p-2 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white">{service.name}</h3>
            {!isExpanded && (
              <p className="text-xs text-gray-500 truncate">{service.description}</p>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-700/50">
            {getServiceContent(serviceId)}
          </div>
        )}
      </div>
    );
  };

  // Render category section
  const renderCategory = (categoryId: ServiceCategory) => {
    const category = SERVICE_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return null;

    return (
      <div key={categoryId} className="space-y-2">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
          {category.name}
        </h4>
        <div className="space-y-2">
          {category.services.map(serviceId => renderServiceItem(serviceId))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 overflow-y-auto">
      {SERVICE_CATEGORIES.map(category => renderCategory(category.id))}
    </div>
  );
}
