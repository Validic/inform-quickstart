'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { DataRecord } from '@/types';

interface MarketplaceSource {
  type: string;
  connected: boolean;
  logo_url: string;
  connect_url: string;
  disconnect_url: string;
}

interface MarketplaceModalProps {
  user: DataRecord;
  onClose: () => void;
}

function formatSourceName(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function MarketplaceModal({ user, onClose }: MarketplaceModalProps) {
  const [sources, setSources] = useState<MarketplaceSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    if (!user.marketplace?.url) return;
    setLoading(true);
    setError(null);
    try {
      const redirectUri = encodeURIComponent(window.location.href);
      const url = `${user.marketplace.url}&format=json&redirect_uri=${redirectUri}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load sources (${res.status})`);
      const data = await res.json();
      setSources(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sources');
    } finally {
      setLoading(false);
    }
  }, [user.marketplace?.url]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const userId = user.user?.user_id || user.id || 'Unknown';
  const shortId = userId.length > 12 ? `${userId.slice(0, 8)}…` : userId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-white font-semibold text-base">Connect Sources</h2>
            <p className="text-gray-400 text-xs mt-0.5">User {shortId}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSources}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm py-8 justify-center">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {!loading && !error && sources.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">No sources available.</p>
          )}

          {!loading && !error && sources.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {sources.map((source) => (
                <div
                  key={source.type}
                  className={`relative flex flex-col items-center p-3 rounded-lg border transition-colors ${
                    source.connected
                      ? 'border-green-500/60 bg-green-500/5'
                      : 'border-gray-700 bg-gray-800/50'
                  }`}
                >
                  {source.connected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">✓</span>
                    </div>
                  )}
                  <img
                    src={source.logo_url}
                    alt={formatSourceName(source.type)}
                    className="w-10 h-10 rounded-lg object-contain mb-2"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <p className={`text-xs font-medium mb-2 text-center ${source.connected ? 'text-white' : 'text-gray-400'}`}>
                    {formatSourceName(source.type)}
                  </p>
                  {source.connected ? (
                    <a
                      href={source.disconnect_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                    >
                      Disconnect
                    </a>
                  ) : (
                    <a
                      href={source.connect_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                    >
                      Connect
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
