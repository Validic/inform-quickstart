import { NextResponse } from 'next/server';

export async function GET() {
  const { ORG_ID, ORG_TOKEN, API_URL, DATAGEN_URL, STREAM_URL } = process.env;

  if (!ORG_ID || !ORG_TOKEN || !API_URL || !DATAGEN_URL) {
    return NextResponse.json({ error: 'Missing required environment variables' }, { status: 404 });
  }

  return NextResponse.json({
    config: {
      token: ORG_TOKEN,
      orgId: ORG_ID,
      apiUrl: API_URL,
      datagenUrl: DATAGEN_URL,
      streamsUrl: STREAM_URL || '',
    },
    userIds: [],
  });
}
