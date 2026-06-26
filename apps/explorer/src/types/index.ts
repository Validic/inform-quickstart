export interface CustomHeader {
  key: string;
  value: string;
}

export interface ConfigValues {
  coreUrl: string;
  dataGeneratorUrl: string;
  streamsUrl: string;
  authToken: string;
  organizationId: string;
  headers: CustomHeader[];
}

export interface HealthStatus {
  coreUrl: 'checking' | 'healthy' | 'unhealthy' | 'idle';
  dataGeneratorUrl: 'checking' | 'healthy' | 'unhealthy' | 'idle';
}

export interface ApiSetup {
  userId: string;
  startDate: string;
  endDate: string;
  source: string;
  dataType: string;
  deviceType?: string;
  includeSegments?: boolean;
  serviceName?: string;
  replayDate?: string;
  usersPage?: number;
  usersLimit?: number;
  usersSortOrder?: 'asc' | 'desc';
  fetchGeneric?: boolean;
}

export interface ReadingLogEntry {
  time: string;
  value: number;
  display_time?: string;
  device_id?: string;
}

export interface Metric {
  type: string;
  unit: string;
  value?: number;
  origin?: string;
  reading_log?: ReadingLogEntry[];
}

export interface DataRecord {
  id?: string;
  uid?: string;
  type?: string;
  category?: string;
  name?: string;
  log_id?: string;
  status?: string;
  start_time?: string;
  end_time?: string;
  created_at?: string;
  updated_at?: string;
  utc_offset?: number;
  offset_origin?: string;
  metrics?: Metric[];
  segments?: {
    name: string;
    metrics: Metric[];
  }[];
  source?: string | { type?: string; device?: string; devices?: Record<string, { id: string; model: string; manufacturer: string }> };
  user?: {
    user_id?: string;
    organization_id?: string;
    uid?: string;
  };
  marketplace?: {
    token: string;
    url: string;
  };
  mobile?: {
    token: string;
  };
  location?: {
    timezone: string;
    country_code: string;
  };
}

export interface ActualRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface PaginationSummary {
  page: number;
  limit: number;
  total?: number;
  hasMore: boolean;
  recordsOnPage: number;
}

export interface ApiResponse {
  success: boolean;
  data?: DataRecord[];
  dataByType?: DataTypeGroup[];
  error?: string;
  timestamp: string;
  requestDuration?: number;
  actualRequest?: ActualRequest;
  pagination?: PaginationSummary;
}

export interface DataTypeGroup {
  dataType: string;
  label: string;
  records: DataRecord[];
  recordCount: number;
  status: 'success' | 'error' | 'loading';
  error?: string;
}

export type ServiceType =
  | 'get-user'
  | 'get-users'
  | 'create-user'
  | 'get-user-data'
  | 'replay-stream'
  | 'generate-data';

export type ServiceCategory = 'users' | 'data';

export interface ServiceCategoryConfig {
  id: ServiceCategory;
  name: string;
  services: ServiceType[];
}

export interface ServiceConfig {
  id: ServiceType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const SERVICES: ServiceConfig[] = [
  {
    id: 'get-user',
    name: 'Get User',
    description: 'Get a specific user by ID',
    icon: 'User',
    color: '#0066CC',
  },
  {
    id: 'get-users',
    name: 'Get Users',
    description: 'List all users in organization',
    icon: 'Users',
    color: '#0088EE',
  },
  {
    id: 'create-user',
    name: 'Create User',
    description: 'Provision a new user in the organization',
    icon: 'UserPlus',
    color: '#0088EE',
  },
  {
    id: 'get-user-data',
    name: 'Get User Data',
    description: 'Fetch health data for a specific user',
    icon: 'Database',
    color: '#00AAFF',
  },
  {
    id: 'replay-stream',
    name: 'Replay Stream',
    description: 'Replay historical data stream',
    icon: 'RefreshCw',
    color: '#00CCFF',
  },
  {
    id: 'generate-data',
    name: 'Generate Data',
    description: 'Create synthetic health data for testing',
    icon: 'Sparkles',
    color: '#22c55e',
  },
];

export const SERVICE_CATEGORIES: ServiceCategoryConfig[] = [
  {
    id: 'users',
    name: 'Users',
    services: ['get-user', 'get-users', 'create-user'],
  },
  {
    id: 'data',
    name: 'Data',
    services: ['get-user-data', 'replay-stream', 'generate-data'],
  },
];

export const DATA_TYPES = [
  { value: 'summaries', label: 'Daily Summaries', sources: ['fitbit', 'garmin', 'withings', 'whoop', 'oura'] },
  { value: 'workouts', label: 'Workouts', sources: ['strava', 'garmin', 'polar', 'whoop', 'oura'] },
  { value: 'sleep', label: 'Sleep', sources: ['fitbit', 'garmin', 'withings', 'whoop', 'oura', 'polar'] },
  { value: 'nutrition', label: 'Nutrition', sources: ['fitbit', 'mapmyfitness'] },
  { value: 'measurements', label: 'Measurements', sources: ['omron', 'ihealth', 'withings_pro', 'onetouch', 'smart_meter'] },
  { value: 'intraday', label: 'Intraday', sources: ['fitbit', 'garmin', 'whoop', 'oura'] },
  { value: 'cgm', label: 'CGM Data', sources: ['dexcom', 'abbott'] },
];

export const DEVICE_TYPES = [
  'blood_glucose',
  'blood_pressure',
  'inr',
  'peak_flow',
  'pulse_oximeter',
  'spirometer',
  'thermometer',
  'weight_scale',
];

export interface DemoUser {
  id: string;
  name: string;
}

export function getUserNameById(userId: string, users: DemoUser[]): string | undefined {
  return users.find(u => u.id === userId)?.name;
}

export interface StreamEvent {
  id: string;
  type: 'poke' | 'data' | 'connection' | 'rule';
  timestamp: string;
  data?: StreamDataRecord;
  raw?: string;
}

export interface StreamDataRecord {
  id: string;
  type: string;
  user_id?: string;
  organization_id?: string;
  source?: string | { type?: string; device?: string };
  timestamp?: string;
  start_time?: string;
  end_time?: string;
  metrics?: Metric[];
  [key: string]: unknown;
}

export interface StreamState {
  isConnected: boolean;
  events: StreamEvent[];
  dataRecords: StreamDataRecord[];
  pokeCount: number;
  startTime: string | null;
  error: string | null;
}

export interface HistoryEntry {
  id: string;
  serviceType: ServiceType;
  response: ApiResponse;
  setup: ApiSetup;
  timestamp: string;
}
