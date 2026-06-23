import { ConfigValues, ApiSetup, ApiResponse, ServiceType, DataRecord, DataTypeGroup, DATA_TYPES, ActualRequest, PaginationSummary } from '@/types';
import { buildRequest } from './requestBuilder';

export async function executeApiRequest(
  config: ConfigValues,
  setup: ApiSetup,
  serviceType: ServiceType,
  apiBaseUrl?: string
): Promise<ApiResponse> {
  const startTime = Date.now();
  let actualRequest: ActualRequest | undefined;

  try {
    // Special case: fetch all data types in parallel when no specific type requested
    // Skip if fetchGeneric is true - caller wants a single generic request instead
    if (serviceType === 'get-user-data' && !setup.dataType && !setup.fetchGeneric) {
      return await fetchAllDataTypes(config, setup, startTime, apiBaseUrl);
    }

    // Build the request using shared builder
    const requestConfig = buildRequest(config, setup, serviceType);

    // Capture the actual request for debugging
    actualRequest = {
      method: requestConfig.method,
      url: requestConfig.url,
      headers: { ...requestConfig.headers },
      body: requestConfig.body,
    };

    // Execute through proxy
    const proxyUrl = `${apiBaseUrl || ''}/api/proxy?url=${encodeURIComponent(requestConfig.url)}`;
    const response = await fetch(proxyUrl, {
      method: requestConfig.method,
      headers: requestConfig.headers,
      body: requestConfig.body ? JSON.stringify(requestConfig.body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        errorBody.errors?.join(', ') ||
          errorBody.error ||
          `Request failed with status ${response.status}`
      );
    }

    const responseData = await response.json();

    // Normalize response data structure
    let data: DataRecord[] = [];
    if (Array.isArray(responseData)) {
      data = responseData;
    } else if (responseData.data) {
      data = Array.isArray(responseData.data) ? responseData.data : [responseData.data];
    } else {
      // Check if response is grouped by data type (e.g., { summaries: [...], workouts: [...], ... })
      const dataTypeKeys = ['summaries', 'workouts', 'sleep', 'nutrition', 'measurements', 'cgm', 'intraday'];
      const hasDataTypeKeys = dataTypeKeys.some(key => Array.isArray(responseData[key]));

      if (hasDataTypeKeys) {
        // Flatten all data type arrays into a single array, adding 'type' field to each record
        dataTypeKeys.forEach(key => {
          if (Array.isArray(responseData[key])) {
            const recordsWithType = responseData[key].map((record: DataRecord) => ({
              ...record,
              type: record.type || key.replace(/s$/, ''), // e.g., 'summaries' -> 'summary'
            }));
            data.push(...recordsWithType);
          }
        });
      } else if (Object.keys(responseData).length > 0) {
        data = [responseData];
      }
    }

    // Extract pagination info for get-users
    let pagination: PaginationSummary | undefined;
    if (serviceType === 'get-users') {
      const limit = setup.usersLimit || 50;
      const page = setup.usersPage || 0;
      // Check if API returned summary with total
      const total = responseData.summary?.total_count;
      // Determine if there are more results
      // hasMore is true if we got a full page of results (likely more pages exist)
      const hasMore = data.length === limit;

      pagination = {
        page,
        limit,
        total,
        hasMore,
        recordsOnPage: data.length,
      };
    }

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestDuration: Date.now() - startTime,
      actualRequest,
      pagination,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      timestamp: new Date().toISOString(),
      requestDuration: Date.now() - startTime,
      actualRequest,
    };
  }
}

async function fetchAllDataTypes(
  config: ConfigValues,
  setup: ApiSetup,
  startTime: number,
  apiBaseUrl?: string
): Promise<ApiResponse> {
  // Fetch all data types in parallel
  const dataTypePromises = DATA_TYPES.map(async (dt): Promise<DataTypeGroup> => {
    try {
      const modifiedSetup = { ...setup, dataType: dt.value };
      const requestConfig = buildRequest(config, modifiedSetup, 'get-user-data');

      const proxyUrl = `${apiBaseUrl || ''}/api/proxy?url=${encodeURIComponent(requestConfig.url)}`;

      const response = await fetch(proxyUrl, {
        method: requestConfig.method,
        headers: requestConfig.headers,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error(`[API] ${dt.value} FAILED (${response.status}):`, JSON.stringify(errorBody, null, 2));
        return {
          dataType: dt.value,
          label: dt.label,
          records: [],
          recordCount: 0,
          status: 'error',
          error: errorBody.errors?.join(', ') || errorBody.error || `Failed with status ${response.status}`,
        };
      }

      const responseData = await response.json();
      let records: DataRecord[] = [];

      if (Array.isArray(responseData)) {
        records = responseData;
      } else if (responseData.data) {
        records = Array.isArray(responseData.data) ? responseData.data : [responseData.data];
      } else if (Object.keys(responseData).length > 0 && !responseData.summary) {
        // Don't wrap if it's just a summary object with no actual data
        records = [responseData];
      }

      return {
        dataType: dt.value,
        label: dt.label,
        records,
        recordCount: records.length,
        status: 'success',
      };
    } catch (error) {
      return {
        dataType: dt.value,
        label: dt.label,
        records: [],
        recordCount: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  const dataByType = await Promise.all(dataTypePromises);

  // Check if any succeeded
  const anySuccess = dataByType.some(group => group.status === 'success');

  return {
    success: anySuccess,
    dataByType,
    timestamp: new Date().toISOString(),
    requestDuration: Date.now() - startTime,
    error: anySuccess ? undefined : 'All data type requests failed',
  };
}
