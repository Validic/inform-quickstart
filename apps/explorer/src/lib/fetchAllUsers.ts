import { ConfigValues, ApiSetup, DataRecord } from '@/types';
import { buildRequest } from './requestBuilder';

export interface FetchAllUsersProgress {
  currentPage: number;
  totalFetched: number;
  isComplete: boolean;
  users: CondensedUser[];
}

export interface CondensedUser {
  id: string;
  uid: string;
}

export interface FetchAllUsersResult {
  success: boolean;
  users: CondensedUser[];
  totalCount: number;
  pagesRequested: number;
  error?: string;
  durationMs: number;
}

/**
 * Fetches all users by paginating through all pages until no more results.
 * Calls the onProgress callback after each page fetch.
 */
export async function fetchAllUsers(
  config: ConfigValues,
  onProgress: (progress: FetchAllUsersProgress) => void,
  apiBaseUrl?: string,
  sortOrder: 'asc' | 'desc' = 'desc',
  pageSize: number = 100
): Promise<FetchAllUsersResult> {
  const startTime = Date.now();
  const allUsers: CondensedUser[] = [];
  let currentPage = 0;
  let hasMore = true;

  try {
    while (hasMore) {
      // Build setup for this page
      const setup: ApiSetup = {
        userId: '',
        startDate: '',
        endDate: '',
        source: '',
        dataType: '',
        usersPage: currentPage,
        usersLimit: pageSize,
        usersSortOrder: sortOrder,
      };

      // Build the request
      const requestConfig = buildRequest(config, setup, 'get-users');

      // Execute through proxy
      const proxyUrl = `${apiBaseUrl || ''}/api/proxy?url=${encodeURIComponent(requestConfig.url)}`;
      const response = await fetch(proxyUrl, {
        method: requestConfig.method,
        headers: requestConfig.headers,
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

      // Extract users from response
      let users: DataRecord[] = [];
      if (Array.isArray(responseData)) {
        users = responseData;
      } else if (responseData.data) {
        users = Array.isArray(responseData.data) ? responseData.data : [responseData.data];
      }

      // Extract just id and uid from each user
      const condensedUsers: CondensedUser[] = users
        .filter(user => user.id && user.uid)
        .map(user => ({
          id: user.id!,
          uid: user.uid!,
        }));

      allUsers.push(...condensedUsers);

      // Check if there are more pages
      // If we got fewer results than the page size, we've reached the end
      hasMore = users.length === pageSize;
      currentPage++;

      // Report progress
      onProgress({
        currentPage,
        totalFetched: allUsers.length,
        isComplete: !hasMore,
        users: allUsers,
      });

      // Small delay between requests to be nice to the API
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return {
      success: true,
      users: allUsers,
      totalCount: allUsers.length,
      pagesRequested: currentPage,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      users: allUsers,
      totalCount: allUsers.length,
      pagesRequested: currentPage,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      durationMs: Date.now() - startTime,
    };
  }
}
