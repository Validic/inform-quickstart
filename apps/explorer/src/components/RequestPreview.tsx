'use client';

import { useState } from 'react';
import { Copy, Check, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { ConfigValues, ApiSetup, ServiceType } from '@/types';
import { buildRequest, buildCurlCommand, RequestConfig } from '@/lib/requestBuilder';
import { obfuscateUrlToken, obfuscateHeaderValue } from '@/lib/obfuscate';

interface RequestPreviewProps {
  config: ConfigValues;
  setup: ApiSetup;
  serviceType: ServiceType;
}

export default function RequestPreview({ config, setup, serviceType }: RequestPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  let preview: RequestConfig;
  try {
    preview = buildRequest(config, setup, serviceType);
  } catch {
    preview = { method: 'GET', url: '', headers: {} };
  }

  const handleCopy = async () => {
    const curlCommand = buildCurlCommand(preview);
    await navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const methodColors: Record<string, string> = {
    GET: 'text-green-400 bg-green-500/20',
    POST: 'text-blue-400 bg-blue-500/20',
    PUT: 'text-yellow-400 bg-yellow-500/20',
    DELETE: 'text-red-400 bg-red-500/20',
  };

  return (
    <div className="glass-panel mb-4 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-blue-500/20">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-1"
        >
          <Send className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-white">Request Preview</span>
          <span className={`px-2 py-0.5 rounded text-xs font-mono ${methodColors[preview.method]}`}>
            {preview.method}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-gray-700/50 transition-colors"
            title="Copy as cURL"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-700/50 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 max-h-[30vh] overflow-y-auto">
          {/* URL */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">
              Endpoint
            </label>
            <div className="bg-gray-900/50 rounded-lg p-3 font-mono text-sm break-all">
              <span className={`${methodColors[preview.method]} px-1.5 py-0.5 rounded mr-2`}>
                {preview.method}
              </span>
              <span className="text-gray-300">{obfuscateUrlToken(preview.url)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">
              Headers
            </label>
            <div className="bg-gray-900/50 rounded-lg p-3 font-mono text-sm space-y-1">
              {(Object.entries(preview.headers) as [string, string][]).map(([key, value]) => (
                <div key={key}>
                  <span className="text-purple-400">{key}</span>
                  <span className="text-gray-500">: </span>
                  <span className="text-gray-300">{obfuscateHeaderValue(key, value)}</span>
                </div>
              ))}
            </div>
          </div>

          {preview.body !== undefined && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">
                Request Body
              </label>
              <pre className="bg-gray-900/50 rounded-lg p-3 font-mono text-sm text-gray-300 overflow-x-auto">
                {JSON.stringify(preview.body as Record<string, unknown>, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
