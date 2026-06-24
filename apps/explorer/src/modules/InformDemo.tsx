'use client';

import { useState, useCallback, useEffect } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import CollapsiblePanel from '@/components/CollapsiblePanel';
import ConfigPanel from '@/components/ConfigPanel';
import ApiSetupPanel from '@/components/ApiSetupPanel';
import AccordionServicePanel from '@/components/AccordionServicePanel';
import ResponsePanel from '@/components/ResponsePanel';
import StreamVisualization from '@/components/StreamVisualization';
import ThemeToggle from '@/components/ThemeToggle';
import HelpPanel from '@/components/HelpPanel';
import ConfigUploadModal from '@/components/ConfigUploadModal';
import { useConfig } from '@/context/ConfigContext';
import { ConfigValues, ApiSetup, ApiResponse, ServiceType, HealthStatus, HistoryEntry } from '@/types';
import { executeApiRequest } from '@/lib/api';

const getDefaultDates = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  return { startDate: formatDate(start), endDate: formatDate(end) };
};

const defaultSetup: ApiSetup = {
  userId: '',
  ...getDefaultDates(),
  source: '',
  dataType: '',
};

const defaultHealthStatus: HealthStatus = {
  coreUrl: 'idle',
  dataGeneratorUrl: 'idle',
};

type LayoutMode = 'grid' | 'accordion';
type PanelKey = 'config' | 'setup' | 'response' | 'help';

export default function InformDemo({ apiBaseUrl }: { apiBaseUrl?: string }) {
  const { config: envConfig, users, isConfigured, isLoading: configLoading } = useConfig();

  const [showUploadModal, setShowUploadModal] = useState(false);

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('accordion');

  const [panelStates, setPanelStates] = useState<Record<PanelKey, boolean>>({
    config: true,
    setup: false,
    response: false,
    help: true,
  });

  const handlePanelToggle = useCallback((panel: PanelKey) => {
    setPanelStates(prev => ({ ...prev, [panel]: !prev[panel] }));
  }, []);

  const [config, setConfig] = useState<ConfigValues>(() => ({
    coreUrl: envConfig?.apiUrl || 'https://api.v2.validic.com',
    dataGeneratorUrl: envConfig?.datagenUrl || 'https://datagen.prod.validic.com',
    authToken: envConfig?.token || '',
    organizationId: envConfig?.orgId || '',
    headers: [],
  }));

  useEffect(() => {
    if (envConfig) {
      setConfig({
        coreUrl: envConfig.apiUrl,
        dataGeneratorUrl: envConfig.datagenUrl,
        authToken: envConfig.token,
        organizationId: envConfig.orgId,
        headers: [],
      });
      setShowUploadModal(false);
    }
  }, [envConfig]);

  const [setup, setSetup] = useState<ApiSetup>(defaultSetup);
  const [selectedService, setSelectedService] = useState<ServiceType>('get-user');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>(defaultHealthStatus);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | undefined>();

  const checkHealth = useCallback(async (urlKey: keyof HealthStatus, url: string) => {
    if (!url) {
      setHealthStatus(prev => ({ ...prev, [urlKey]: 'idle' }));
      return;
    }
    setHealthStatus(prev => ({ ...prev, [urlKey]: 'checking' }));
    try {
      const healthUrl = apiBaseUrl
        ? `${apiBaseUrl}/api/health?url=${encodeURIComponent(url)}`
        : `/api/health?url=${encodeURIComponent(url)}`;
      const res = await fetch(healthUrl);
      const data = await res.json();
      setHealthStatus(prev => ({ ...prev, [urlKey]: data.healthy ? 'healthy' : 'unhealthy' }));
    } catch {
      setHealthStatus(prev => ({ ...prev, [urlKey]: 'unhealthy' }));
    }
  }, [apiBaseUrl]);

  const handleHealthCheck = useCallback(() => {
    checkHealth('coreUrl', config.coreUrl);
    checkHealth('dataGeneratorUrl', config.dataGeneratorUrl);
  }, [config.coreUrl, config.dataGeneratorUrl, checkHealth]);

  useEffect(() => {
    const timer = setTimeout(() => { handleHealthCheck(); }, 500);
    return () => clearTimeout(timer);
  }, [config.coreUrl, config.dataGeneratorUrl, handleHealthCheck]);

  const handleExecute = useCallback(async () => {
    if (selectedService === 'replay-stream') {
      setIsStreaming(true);
      setResponse(null);
      return;
    }

    setIsLoading(true);
    setResponse(null);
    await new Promise((resolve) => setTimeout(resolve, 300));

    let activeSetup = setup;
    if (selectedService === 'create-user' && !setup.userId) {
      const uid = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      activeSetup = { ...setup, userId: uid };
      setSetup(activeSetup);
    }

    const apiResponse = await executeApiRequest(config, activeSetup, selectedService, apiBaseUrl);
    setResponse(apiResponse);

    const historyEntry: HistoryEntry = {
      id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      serviceType: selectedService,
      response: apiResponse,
      setup: { ...setup },
      timestamp: new Date().toISOString(),
    };
    setHistory(prev => [historyEntry, ...prev].slice(0, 50));
    setCurrentHistoryId(historyEntry.id);
    setIsLoading(false);
  }, [config, setup, selectedService, apiBaseUrl]);

  const handleStopStream = useCallback(() => { setIsStreaming(false); }, []);

  const handleServiceChange = useCallback((service: ServiceType) => {
    setSelectedService(service);
    setResponse(null);
    setIsStreaming(false);
    setCurrentHistoryId(undefined);
    setSetup(prev => ({ ...prev, usersPage: 0 }));
  }, []);

  const handleHistorySelect = useCallback((entry: HistoryEntry) => {
    setResponse(entry.response);
    setCurrentHistoryId(entry.id);
    setSelectedService(entry.serviceType);
    setSetup(entry.setup);
  }, []);

  const handleHistoryClear = useCallback(() => {
    setHistory([]);
    setCurrentHistoryId(undefined);
  }, []);

  const handleNextPage = useCallback(async () => {
    if (!response?.pagination || isPaginating) return;
    const newPage = response.pagination.page + 1;
    setIsPaginating(true);
    const newSetup = { ...setup, usersPage: newPage, usersLimit: response.pagination.limit };
    const apiResponse = await executeApiRequest(config, newSetup, 'get-users', apiBaseUrl);
    setResponse(apiResponse);
    setSetup(newSetup);
    setIsPaginating(false);
  }, [response?.pagination, isPaginating, setup, config, apiBaseUrl]);

  const handlePrevPage = useCallback(async () => {
    if (!response?.pagination || isPaginating) return;
    const newPage = Math.max(0, response.pagination.page - 1);
    if (newPage === response.pagination.page) return;
    setIsPaginating(true);
    const newSetup = { ...setup, usersPage: newPage, usersLimit: response.pagination.limit };
    const apiResponse = await executeApiRequest(config, newSetup, 'get-users', apiBaseUrl);
    setResponse(apiResponse);
    setSetup(newSetup);
    setIsPaginating(false);
  }, [response?.pagination, isPaginating, setup, config, apiBaseUrl]);

  const configWidth = panelStates.config ? 48 : 280;
  const setupWidth = panelStates.setup ? 48 : 400;

  if (configLoading) {
    return (
      <main className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: 'var(--text-secondary)' }}>Loading configuration...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {(!isConfigured || showUploadModal) && (
        <ConfigUploadModal
          onClose={isConfigured ? () => setShowUploadModal(false) : undefined}
        />
      )}

      <header className="flex-shrink-0 glass-panel m-4 mb-0 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Validic API Explorer
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Interactive API Workbench
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="h-6 w-px" style={{ background: 'var(--border-color)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Powered by Validic
          </span>
        </div>
      </header>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        <CollapsiblePanel
          title="Configuration"
          isCollapsed={panelStates.config}
          onToggle={() => handlePanelToggle('config')}
          position="left"
          defaultWidth={`${configWidth}px`}
        >
          <ConfigPanel
            config={config}
            onChange={setConfig}
            healthStatus={healthStatus}
            onHealthCheck={handleHealthCheck}
            onUploadConfig={() => setShowUploadModal(true)}
            showUploadButton={true}
          />
        </CollapsiblePanel>

        <CollapsiblePanel
          title={
            <div className="flex items-center gap-2">
              <span>API Setup</span>
              {!panelStates.setup && (
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setLayoutMode('grid'); }}
                    className={`p-1 rounded transition-colors ${layoutMode === 'grid' ? 'bg-blue-500/30 text-blue-300' : 'text-gray-500 hover:text-gray-300'}`}
                    title="Grid layout"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setLayoutMode('accordion'); }}
                    className={`p-1 rounded transition-colors ${layoutMode === 'accordion' ? 'bg-blue-500/30 text-blue-300' : 'text-gray-500 hover:text-gray-300'}`}
                    title="Accordion layout"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          }
          isCollapsed={panelStates.setup}
          onToggle={() => handlePanelToggle('setup')}
          position="middle"
          defaultWidth={`${setupWidth}px`}
        >
          {layoutMode === 'grid' ? (
            <ApiSetupPanel
              setup={setup}
              onChange={setSetup}
              selectedService={selectedService}
              onServiceChange={handleServiceChange}
              onExecute={handleExecute}
              isLoading={isLoading}
              config={config}
            />
          ) : (
            <AccordionServicePanel
              setup={setup}
              onChange={setSetup}
              selectedService={selectedService}
              onServiceChange={handleServiceChange}
              onExecute={handleExecute}
              isLoading={isLoading}
              config={config}
              users={users}
            />
          )}
        </CollapsiblePanel>

        <div className={`flex flex-col panel-transition overflow-hidden ${panelStates.response ? 'w-12 flex-shrink-0' : 'flex-1'}`}>
          <div className="flex-1 glass-panel overflow-hidden">
            <CollapsiblePanel
              title={isStreaming ? 'Stream' : 'Response'}
              isCollapsed={panelStates.response}
              onToggle={() => handlePanelToggle('response')}
              position="middle"
              defaultWidth="100%"
            >
              {isStreaming ? (
                <StreamVisualization
                  config={config}
                  setup={setup}
                  isActive={isStreaming}
                  onStop={handleStopStream}
                  apiBaseUrl={apiBaseUrl}
                />
              ) : (
                <ResponsePanel
                  response={response}
                  isLoading={isLoading}
                  history={history}
                  onHistorySelect={handleHistorySelect}
                  onHistoryClear={handleHistoryClear}
                  currentHistoryId={currentHistoryId}
                  onNextPage={handleNextPage}
                  onPrevPage={handlePrevPage}
                  isPaginating={isPaginating}
                />
              )}
            </CollapsiblePanel>
          </div>
        </div>

        <div className={`flex flex-col panel-transition overflow-hidden ${panelStates.help ? 'w-12' : 'flex-1'}`}>
          <div className="flex-1 glass-panel overflow-hidden">
            <CollapsiblePanel
              title="Help"
              isCollapsed={panelStates.help}
              onToggle={() => handlePanelToggle('help')}
              position="right"
              defaultWidth="100%"
            >
              <HelpPanel selectedService={selectedService} />
            </CollapsiblePanel>
          </div>
        </div>
      </div>
    </main>
  );
}
