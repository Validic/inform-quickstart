/**
 * Utility functions for obfuscating sensitive data in display
 */

/**
 * Obfuscates a token, showing only a hint of the original value
 * @param token - The token to obfuscate
 * @param showLast - Number of characters to show at the end (default: 4)
 * @returns Obfuscated token string
 */
export function obfuscateToken(token: string, showLast: number = 4): string {
  if (!token) return '';
  if (token.length <= showLast) return '••••••••';
  return '••••••••' + token.slice(-showLast);
}

/**
 * Obfuscates a URL by hiding the token query parameter
 * @param url - The URL that may contain a token parameter
 * @returns URL with token obfuscated
 */
export function obfuscateUrlToken(url: string): string {
  if (!url) return '';

  // Match token= query parameter
  return url.replace(/([?&])token=([^&]+)/gi, (match, prefix, token) => {
    return `${prefix}token=${obfuscateToken(token)}`;
  });
}

/**
 * Obfuscates sensitive header values
 * @param key - Header name
 * @param value - Header value
 * @returns Obfuscated value if sensitive, original value otherwise
 */
export function obfuscateHeaderValue(key: string, value: string): string {
  const sensitiveHeaders = ['authorization', 'x-api-key', 'api-key', 'token'];

  if (sensitiveHeaders.includes(key.toLowerCase())) {
    // Handle "Bearer xxx" format
    if (value.toLowerCase().startsWith('bearer ')) {
      const token = value.slice(7);
      return `Bearer ${obfuscateToken(token)}`;
    }
    return obfuscateToken(value);
  }

  return value;
}

/**
 * Deep clones an object and obfuscates sensitive data within it
 * Useful for displaying API responses that may contain actualRequest with tokens
 * @param obj - Object to sanitize
 * @returns Sanitized copy of the object
 */
export function obfuscateSensitiveData<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => obfuscateSensitiveData(item)) as T;
  }

  // Clone the object
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // Obfuscate URL fields that may contain tokens
    if ((key === 'url' || key.endsWith('Url')) && typeof value === 'string') {
      result[key] = obfuscateUrlToken(value);
    }
    // Obfuscate headers object
    else if (key === 'headers' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const sanitizedHeaders: Record<string, string> = {};
      for (const [headerKey, headerValue] of Object.entries(value as Record<string, string>)) {
        sanitizedHeaders[headerKey] = obfuscateHeaderValue(headerKey, headerValue);
      }
      result[key] = sanitizedHeaders;
    }
    // Recursively process nested objects
    else if (typeof value === 'object') {
      result[key] = obfuscateSensitiveData(value);
    }
    else {
      result[key] = value;
    }
  }

  return result as T;
}
