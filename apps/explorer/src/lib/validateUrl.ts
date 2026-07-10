/**
 * Validates that a caller-supplied URL string is well-formed and uses
 * http/https. These API routes proxy requests to caller-supplied hosts,
 * so this guards against obviously malformed or non-http(s) targets
 * (e.g. file:, data:) before we fetch them.
 */
export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
