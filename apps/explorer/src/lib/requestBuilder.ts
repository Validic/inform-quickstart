import { ConfigValues, ApiSetup, ServiceType } from '@/types';

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

function trimUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function toDateString(dateInput: string): string {
  if (!dateInput) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
  return new Date(dateInput).toISOString().split('T')[0];
}

function toISO8601(dateInput: string): string {
  if (!dateInput) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateInput)) return dateInput;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return `${dateInput}T00:00:00Z`;
  return new Date(dateInput).toISOString();
}

export function buildRequest(
  config: ConfigValues,
  setup: ApiSetup,
  serviceType: ServiceType
): RequestConfig {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.headers && config.headers.length > 0) {
    config.headers.forEach((header) => {
      if (header.key && header.key.trim()) {
        headers[header.key.trim()] = header.value || '';
      }
    });
  }

  switch (serviceType) {
    case 'get-user': {
      const url = `${trimUrl(config.coreUrl)}/organizations/${config.organizationId}/users/${setup.userId}?token=${config.authToken}`;
      return { method: 'GET', url, headers };
    }

    case 'get-users': {
      const params: string[] = [`token=${config.authToken}`];
      const limit = setup.usersLimit || 50;
      const page = setup.usersPage || 0;
      params.push(`limit=${limit}`);
      if (page > 0) params.push(`offset=${page}`);
      const sortOrder = setup.usersSortOrder || 'desc';
      params.push(`sort[]=${sortOrder === 'desc' ? '-created_at' : 'created_at'}`);
      const url = `${trimUrl(config.coreUrl)}/organizations/${config.organizationId}/users?${params.join('&')}`;
      return { method: 'GET', url, headers };
    }

    case 'get-user-data': {
      const coreUrl = trimUrl(config.coreUrl);
      const baseUrl = setup.dataType
        ? `${coreUrl}/organizations/${config.organizationId}/users/${setup.userId}/${setup.dataType}`
        : `${coreUrl}/organizations/${config.organizationId}/users/${setup.userId}`;
      const startDateStr = toDateString(setup.startDate);
      const endDateStr = toDateString(setup.endDate);
      const params = [`start_date=${startDateStr}`, `end_date=${endDateStr}`, `token=${config.authToken}`];
      const url = `${baseUrl}?${params.join('&')}`;
      if (setup.serviceName) headers['Service-Name'] = setup.serviceName;
      return { method: 'GET', url, headers };
    }

    case 'generate-data': {
      const url = `${trimUrl(config.dataGeneratorUrl)}/organizations/${config.organizationId}/users/${setup.userId}/${setup.dataType}`;
      headers['Token'] = config.authToken;
      const body: Record<string, unknown> = {
        source: setup.source,
        start_time: toISO8601(setup.startDate),
        end_time: toISO8601(setup.endDate),
      };
      if (setup.dataType === 'measurements' && setup.deviceType) body.device_type = setup.deviceType;
      if (setup.dataType === 'nutrition' && setup.includeSegments) body.include_segments = setup.includeSegments;
      return { method: 'POST', url, headers, body };
    }

    case 'replay-stream': {
      let url = `https://streams.v2.validic.com/replay?token=${config.authToken}`;
      if (setup.replayDate) url += `&date=${setup.replayDate}`;
      return { method: 'GET', url, headers };
    }

    default:
      throw new Error(`Unknown service type: ${serviceType}`);
  }
}

export function buildCurlCommand(request: RequestConfig): string {
  let cmd = `curl -X ${request.method} "${request.url}"`;
  Object.entries(request.headers).forEach(([key, value]) => {
    cmd += ` \\\n  -H "${key}: ${value}"`;
  });
  if (request.body) {
    cmd += ` \\\n  -d '${JSON.stringify(request.body, null, 2)}'`;
  }
  return cmd;
}
