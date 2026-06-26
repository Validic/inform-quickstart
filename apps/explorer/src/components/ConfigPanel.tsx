'use client';

import { Settings, Key, Globe, Building2, RefreshCw, Plus, Trash2, ListPlus, Upload } from 'lucide-react';
import { ConfigValues, HealthStatus, CustomHeader } from '@/types';
import MaskedInput from './MaskedInput';

interface ConfigPanelProps {
  config: ConfigValues;
  onChange: (config: ConfigValues) => void;
  healthStatus: HealthStatus;
  onHealthCheck: () => void;
  onUploadConfig?: () => void;
  showUploadButton?: boolean;
}

function HealthIndicator({ status }: { status: HealthStatus[keyof HealthStatus] }) {
  if (status === 'idle') {
    return <div className="w-2.5 h-2.5 rounded-full bg-gray-500" title="Not checked" />;
  }
  if (status === 'checking') {
    return <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" title="Checking..." />;
  }
  if (status === 'healthy') {
    return <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" title="Healthy" />;
  }
  return <div className="w-2.5 h-2.5 rounded-full bg-red-500" title="Unreachable" />;
}

export default function ConfigPanel({ config, onChange, healthStatus, onHealthCheck, onUploadConfig, showUploadButton }: ConfigPanelProps) {
  const handleChange = (field: keyof ConfigValues, value: string) => {
    onChange({ ...config, [field]: value });
  };

  const handleAddHeader = () => {
    const newHeaders = [...(config.headers || []), { key: '', value: '' }];
    onChange({ ...config, headers: newHeaders });
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = (config.headers || []).filter((_, i) => i !== index);
    onChange({ ...config, headers: newHeaders });
  };

  const handleHeaderChange = (index: number, field: keyof CustomHeader, value: string) => {
    const newHeaders = [...(config.headers || [])];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    onChange({ ...config, headers: newHeaders });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-blue-300">
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium uppercase tracking-wide">Environment Configuration</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          {showUploadButton && onUploadConfig && (
            <button
              onClick={onUploadConfig}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-300 transition-colors"
              title="Upload configuration file"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Config
            </button>
          )}
          <button
            onClick={onHealthCheck}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-300 transition-colors"
            title="Check API health"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Health
          </button>
        </div>
      </div>

      {/* API URLs */}
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Globe className="w-4 h-4" />
            Core API URL
            <HealthIndicator status={healthStatus.coreUrl} />
          </label>
          <input
            type="url"
            value={config.coreUrl}
            onChange={(e) => handleChange('coreUrl', e.target.value)}
            placeholder="Core API URL"
            className="w-full"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Globe className="w-4 h-4" />
            Data Generator URL
            <HealthIndicator status={healthStatus.dataGeneratorUrl} />
          </label>
          <input
            type="url"
            value={config.dataGeneratorUrl}
            onChange={(e) => handleChange('dataGeneratorUrl', e.target.value)}
            placeholder="Data Generator URL"
            className="w-full"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Globe className="w-4 h-4" />
            Streams URL
          </label>
          <input
            type="url"
            value={config.streamsUrl}
            onChange={(e) => handleChange('streamsUrl', e.target.value)}
            placeholder="Streams URL"
            className="w-full"
          />
        </div>

      </div>

      {/* Divider */}
      <div className="border-t border-blue-500/20 pt-4">
        <div className="flex items-center gap-2 text-blue-300 mb-4">
          <Key className="w-5 h-5" />
          <span className="text-sm font-medium uppercase tracking-wide">Authentication</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Building2 className="w-4 h-4" />
              Organization ID
            </label>
            <input
              type="text"
              value={config.organizationId}
              onChange={(e) => handleChange('organizationId', e.target.value)}
              placeholder="your-organization-id"
              className="w-full"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Key className="w-4 h-4" />
              Auth Token
            </label>
            <MaskedInput
              value={config.authToken}
              onChange={(value) => handleChange('authToken', value)}
              placeholder="Enter your API token"
              className="w-full pr-10"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your token is stored in browser memory only
            </p>
          </div>
        </div>
      </div>

      {/* Custom Headers */}
      <div className="border-t border-blue-500/20 pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-blue-300">
            <ListPlus className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Custom Headers</span>
          </div>
          <button
            onClick={handleAddHeader}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-300 transition-colors"
            title="Add header"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        <div className="space-y-3">
          {(config.headers || []).length === 0 ? (
            <p className="text-xs text-gray-500">No custom headers configured</p>
          ) : (
            (config.headers || []).map((header, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                  placeholder="Header name"
                  className="flex-1 text-sm"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="flex-1 text-sm"
                />
                <button
                  onClick={() => handleRemoveHeader(index)}
                  className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                  title="Remove header"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="border-t border-blue-500/20 pt-4">
        <div className="flex items-center gap-2">
          <div
            className={`status-indicator ${config.authToken ? 'success' : 'pending'}`}
          />
          <span className="text-sm text-gray-400">
            {config.authToken ? 'Token configured' : 'Awaiting token'}
          </span>
        </div>
      </div>
    </div>
  );
}
