import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Try common health check endpoints
    const healthEndpoints = [
      '/status',
      '/health',
      '/up',
      '/',
    ];

    // Parse the base URL - extract just protocol + host (remove any path)
    const parsedUrl = new URL(url);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

    // Try each health endpoint
    for (const endpoint of healthEndpoints) {
      try {
        const checkUrl = `${baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(checkUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json, text/plain, */*',
          },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return NextResponse.json({
            healthy: true,
            endpoint: checkUrl,
            status: response.status,
          });
        }
      } catch {
        // Try next endpoint
        continue;
      }
    }

    // If we get here, none of the endpoints worked
    return NextResponse.json({
      healthy: false,
      error: 'No health endpoint responded',
    });
  } catch (error) {
    return NextResponse.json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
}
