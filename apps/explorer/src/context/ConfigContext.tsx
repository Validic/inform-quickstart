'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { DemoUser, ConfigValues } from '@/types';
import { getDisplayName } from '@/data/names';
import { executeApiRequest } from '@/lib/api';

function buildUserList(userIds: string[]): DemoUser[] {
  return userIds.map((id) => ({
    id,
    name: getDisplayName(id),
  }));
}

export interface EnvConfig {
  token: string;
  orgId: string;
  apiUrl: string;
  datagenUrl: string;
  streamsUrl: string;
}

export interface ParseResult {
  config: EnvConfig | null;
  userIds: string[];
  formatError?: string;
}

interface ConfigContextType {
  config: EnvConfig | null;
  users: DemoUser[];
  isConfigured: boolean;
  isLoading: boolean;
  setConfigFromFile: (content: string) => ParseResult;
  clearConfig: () => void;
  simulateMissingEnv: boolean;
  setSimulateMissingEnv: (value: boolean) => void;
  isDev: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const isDev = process.env.NODE_ENV === 'development';

function parseConfigFile(content: string): ParseResult {
  const lines = content.split('\n');
  const values: Record<string, string> = {};
  const userIds: string[] = [];
  let inUsersSection = false;
  let foundUsersHeader = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) continue;

    if (trimmed.toLowerCase() === 'users') {
      inUsersSection = true;
      foundUsersHeader = true;
      continue;
    }

    if (!trimmed) continue;

    if (inUsersSection) {
      userIds.push(trimmed);
    } else {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        values[key] = value;
      } else if (!foundUsersHeader) {
        return {
          config: null,
          userIds: [],
          formatError: `Invalid line format: "${trimmed}". Expected key=value format or "Users" header.`,
        };
      }
    }
  }

  const token = values['ORG_TOKEN'] || values['NEXT_PUBLIC_INFORM_TOKEN'] || values['NEXT_PUBLIC_VALIDIC_TOKEN'];
  const orgId = values['ORG_ID'] || values['NEXT_PUBLIC_INFORM_ORG_ID'] || values['NEXT_PUBLIC_VALIDIC_ORG_ID'];
  const apiUrl = values['API_URL'] || values['NEXT_PUBLIC_INFORM_API_URL'] || values['NEXT_PUBLIC_VALIDIC_API_URL'];
  const datagenUrl = values['DATAGEN_URL'] || values['NEXT_PUBLIC_INFORM_DATAGEN_URL'] || values['NEXT_PUBLIC_VALIDIC_DATAGEN_URL'];
  // NEXT_PUBLIC_VALIDIC_AI_URL was the original name for this field before being renamed to STREAM_URL
  const streamsUrl = values['STREAM_URL'] || values['NEXT_PUBLIC_INFORM_STREAM_URL'] || values['NEXT_PUBLIC_VALIDIC_STREAM_URL'] || values['NEXT_PUBLIC_VALIDIC_AI_URL'] || '';

  if (token && orgId && apiUrl && datagenUrl) {
    return { config: { token, orgId, apiUrl, datagenUrl, streamsUrl }, userIds };
  }

  return { config: null, userIds: [] };
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [uploadedConfig, setUploadedConfig] = useState<EnvConfig | null>(null);
  const [uploadedUserIds, setUploadedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [simulateMissingEnv, setSimulateMissingEnv] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const hasFetchedUsersRef = useRef(false);

  useEffect(() => {
    async function loadConfig() {
      if (isDev) {
        try {
          const response = await fetch('/api/config');
          if (response.ok) {
            const data = await response.json();
            if (data.config) {
              setUploadedConfig(data.config);
              if (data.userIds && Array.isArray(data.userIds)) {
                setUploadedUserIds(data.userIds);
              }
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // fall through to localStorage
        }
      }

      // Migrate from old localStorage keys (pre-Inform rename)
      if (!localStorage.getItem('inform-config') && localStorage.getItem('validic-config')) {
        localStorage.setItem('inform-config', localStorage.getItem('validic-config')!);
        localStorage.removeItem('validic-config');
      }
      if (!localStorage.getItem('inform-users') && localStorage.getItem('validic-users')) {
        localStorage.setItem('inform-users', localStorage.getItem('validic-users')!);
        localStorage.removeItem('validic-users');
      }

      const savedConfig = localStorage.getItem('inform-config');
      const savedUsers = localStorage.getItem('inform-users');

      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          if (parsed.token && parsed.orgId && parsed.apiUrl && parsed.datagenUrl) {
            setUploadedConfig(parsed);
          }
        } catch {
          // invalid, ignore
        }
      }

      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed)) setUploadedUserIds(parsed);
        } catch {
          // invalid, ignore
        }
      }

      setIsLoading(false);
    }

    loadConfig();
  }, []);

  useEffect(() => {
    async function fetchUsersFromApi() {
      if (!uploadedConfig || uploadedUserIds.length > 0 || isFetchingUsers || hasFetchedUsersRef.current || isLoading) {
        return;
      }

      hasFetchedUsersRef.current = true;
      setIsFetchingUsers(true);

      try {
        const configValues: ConfigValues = {
          coreUrl: uploadedConfig.apiUrl,
          dataGeneratorUrl: uploadedConfig.datagenUrl,
          streamsUrl: uploadedConfig.streamsUrl,
          authToken: uploadedConfig.token,
          organizationId: uploadedConfig.orgId,
          headers: [],
        };

        const response = await executeApiRequest(
          configValues,
          { userId: '', startDate: '', endDate: '', source: '', dataType: '' },
          'get-users'
        );

        if (response.success && response.data && response.data.length > 0) {
          const fetchedUserIds = response.data
            .map(user => user.uid || user.id)
            .filter((id): id is string => !!id);

          if (fetchedUserIds.length > 0) {
            setUploadedUserIds(fetchedUserIds);
            localStorage.setItem('inform-users', JSON.stringify(fetchedUserIds));
          }
        }
      } catch (error) {
        console.error('Failed to auto-fetch users:', error);
      } finally {
        setIsFetchingUsers(false);
      }
    }

    fetchUsersFromApi();
  }, [uploadedConfig, uploadedUserIds.length, isFetchingUsers, isLoading]);

  const handleSetSimulateMissingEnv = useCallback((value: boolean) => {
    if (value) {
      setUploadedConfig(null);
      setUploadedUserIds([]);
      localStorage.removeItem('inform-config');
      localStorage.removeItem('inform-users');
      hasFetchedUsersRef.current = false;
    }
    setSimulateMissingEnv(value);
  }, []);

  const effectiveConfig = uploadedConfig;
  const isConfigured = effectiveConfig !== null;
  const users = buildUserList(uploadedUserIds);

  const setConfigFromFile = useCallback((content: string): ParseResult => {
    const result = parseConfigFile(content);

    if (result.config) {
      setUploadedConfig(result.config);
      setUploadedUserIds(result.userIds);
      localStorage.setItem('inform-config', JSON.stringify(result.config));
      localStorage.setItem('inform-users', JSON.stringify(result.userIds));
      hasFetchedUsersRef.current = result.userIds.length > 0;
    }

    return result;
  }, []);

  const clearConfig = useCallback(() => {
    setUploadedConfig(null);
    setUploadedUserIds([]);
    localStorage.removeItem('inform-config');
    localStorage.removeItem('inform-users');
    hasFetchedUsersRef.current = false;
  }, []);

  return (
    <ConfigContext.Provider value={{
      config: effectiveConfig,
      users,
      isConfigured,
      isLoading,
      setConfigFromFile,
      clearConfig,
      simulateMissingEnv,
      setSimulateMissingEnv: handleSetSimulateMissingEnv,
      isDev,
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
