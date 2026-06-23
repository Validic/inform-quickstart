import { NextRequest, NextResponse } from 'next/server';

// Helper to build headers to forward as tuples (preserves header name casing)
function buildHeaderTuples(request: NextRequest): [string, string][] {
  const headerTuples: [string, string][] = [
    ['Content-Type', 'application/json'],
  ];

  // Track which headers we've already added (case-insensitive)
  const addedHeaders = new Set<string>(['content-type']);

  // Forward known headers with correct casing
  const headersToCheck = ['Token', 'Authorization', 'Platform', 'Service-Name'];
  for (const headerName of headersToCheck) {
    const value = request.headers.get(headerName);
    if (value) {
      headerTuples.push([headerName, value]);
      addedHeaders.add(headerName.toLowerCase());
    }
  }

  // Forward any custom headers (X-* headers and others)
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();

    // Skip if we already added this header
    if (addedHeaders.has(lowerKey)) {
      return;
    }

    // Skip browser-added headers
    const skipHeaders = ['host', 'connection', 'content-length', 'accept', 'accept-encoding', 'accept-language', 'user-agent', 'origin', 'referer', 'sec-', 'cookie', 'cache-control', 'pragma'];
    if (skipHeaders.some(skip => lowerKey.startsWith(skip))) {
      return;
    }

    // Add custom header
    headerTuples.push([key, value]);
    addedHeaders.add(lowerKey);
  });

  return headerTuples;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    console.error('[Proxy] Missing url parameter');
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const headers = buildHeaderTuples(request);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    // Try to parse as JSON, but handle HTML error pages gracefully
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      // Non-JSON response (likely an error page)
      const text = await response.text();
      return NextResponse.json(
        { error: `Server returned non-JSON response (${response.status}): ${text.substring(0, 200)}` },
        { status: response.status }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proxy request failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const headers = buildHeaderTuples(request);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    // Try to parse as JSON, but handle HTML error pages gracefully
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      // Non-JSON response (likely an error page)
      const text = await response.text();
      return NextResponse.json(
        { error: `Server returned non-JSON response (${response.status}): ${text.substring(0, 200)}` },
        { status: response.status }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proxy request failed' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const headers = buildHeaderTuples(request);

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    // Try to parse as JSON, but handle HTML error pages gracefully
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      // Non-JSON response (likely an error page)
      const text = await response.text();
      return NextResponse.json(
        { error: `Server returned non-JSON response (${response.status}): ${text.substring(0, 200)}` },
        { status: response.status }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proxy request failed' },
      { status: 500 }
    );
  }
}
