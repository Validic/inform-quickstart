import { NextRequest } from 'next/server';

// Disable static optimization and set long timeout for streaming
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const date = request.nextUrl.searchParams.get('date');

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let targetUrl = `https://streams.v2.validic.com/replay?token=${token}`;
  if (date) {
    targetUrl += `&date=${date}`;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Accept: 'text/event-stream',
      },
      // Disable automatic body consumption
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: errorText || `HTTP ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      return new Response(JSON.stringify({ error: 'No response body' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use ReadableStream directly for better streaming support
    let isCancelled = false;
    const stream = new ReadableStream({
      async start(controller) {
        let chunkCount = 0;
        try {
          while (!isCancelled) {
            const { done, value } = await reader.read();
            if (done) {
              if (!isCancelled) {
                controller.close();
              }
              break;
            }
            if (isCancelled) break;
            chunkCount++;
            controller.enqueue(value);
          }
        } catch (error) {
          // Ignore errors if cancelled
          if (!isCancelled) {
            try {
              controller.error(error);
            } catch {
              // Controller may already be closed
            }
          }
        }
      },
      cancel() {
        isCancelled = true;
        reader.cancel().catch(() => {});
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Stream connection failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
