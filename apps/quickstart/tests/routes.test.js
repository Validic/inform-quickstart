'use strict';
const request = require('supertest');
const nock = require('nock');

process.env.ORG_ID = 'test-org';
process.env.ORG_TOKEN = 'test-token';
process.env.INFORM_USER_ID = 'user-uid-abc';
process.env.INFORM_MARKETPLACE_URL = 'https://inform-marketplace.test?token=token-xyz';
process.env.INFORM_STREAM_ID = 'stream-123';
process.env.INFORM_API_URL = 'https://inform-api.test';
process.env.INFORM_STREAM_URL = 'https://inform-streams.test';

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

const { app } = require('../server');

afterEach(() => nock.cleanAll());
afterAll(() => nock.restore());

describe('GET /api/status', () => {
  test('returns provisioned status with marketplace URL', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      org_id: 'test-org',
      user_id: 'user-uid-abc',
      stream_id: 'stream-123',
      provisioned: true,
      marketplace_url: 'https://inform-marketplace.test?token=token-xyz',
    });
  });
});

describe('GET /api/apps', () => {
  test('calls the single-user endpoint keyed by uid and returns sources', async () => {
    const scope = nock('https://inform-api.test')
      .get('/organizations/test-org/users/user-uid-abc')
      .query({ token: 'test-token' })
      .reply(200, {
        id: '59b02bde...',
        uid: 'user-uid-abc',
        sources: [
          { type: 'strava', connected_at: '2017-09-11T15:57:51Z', last_processed_at: null, scopes: ['read_all'] },
          { type: 'garmin', connected_at: '2018-09-25T14:20:49Z', last_processed_at: '2019-01-01T00:00:00Z' },
        ],
      });

    const res = await request(app).get('/api/apps');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      sources: [
        { type: 'strava', connected_at: '2017-09-11T15:57:51Z', last_processed_at: null, scopes: ['read_all'] },
        { type: 'garmin', connected_at: '2018-09-25T14:20:49Z', last_processed_at: '2019-01-01T00:00:00Z' },
      ],
    });
    expect(scope.isDone()).toBe(true);
  });

  test('returns empty sources array when user has none connected', async () => {
    nock('https://inform-api.test')
      .get('/organizations/test-org/users/user-uid-abc')
      .query({ token: 'test-token' })
      .reply(200, { id: '59b02bde...', uid: 'user-uid-abc' });

    const res = await request(app).get('/api/apps');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sources: [] });
  });

  test('returns 500 on Inform API failure', async () => {
    nock('https://inform-api.test')
      .get('/organizations/test-org/users/user-uid-abc')
      .query(true)
      .replyWithError('network error');

    const res = await request(app).get('/api/apps');
    expect(res.status).toBe(500);
  });

  test('forwards non-2xx HTTP status from Inform API', async () => {
    nock('https://inform-api.test')
      .get('/organizations/test-org/users/user-uid-abc')
      .query(true)
      .reply(404, 'Not Found');

    const res = await request(app).get('/api/apps');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Inform API error: 404/);
  });

  test('URL-encodes a user_id containing path-traversal characters before forwarding upstream', async () => {
    const scope = nock('https://inform-api.test')
      .get('/organizations/test-org/users/a%2Fb%20..%2Fc')
      .query({ token: 'test-token' })
      .reply(200, { id: 'x', uid: 'a/b ../c', sources: [] });

    const res = await request(app).get('/api/apps').query({ user_id: 'a/b ../c' });
    expect(res.status).toBe(200);
    expect(scope.isDone()).toBe(true);
  });
});

describe('GET /api/data/:type', () => {
  test('returns last 30 days of data for valid type', async () => {
    nock('https://inform-api.test')
      .get('/organizations/test-org/users/user-uid-abc/summaries')
      .query(true)
      .reply(200, { data: [{ id: 'rec-1', type: 'summary', metrics: [{ type: 'steps', value: 8000, unit: 'count' }] }] });

    const res = await request(app).get('/api/data/summaries');
    expect(res.status).toBe(200);
    expect(res.body.data[0].type).toBe('summary');
  });

  test('returns 400 for invalid type', async () => {
    const res = await request(app).get('/api/data/cgm');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid type/);
  });

  test('returns 400 for unknown type', async () => {
    const res = await request(app).get('/api/data/heartrate');
    expect(res.status).toBe(400);
  });

  test('URL-encodes a user_id containing path-traversal characters before forwarding upstream', async () => {
    const scope = nock('https://inform-api.test')
      .get('/organizations/test-org/users/a%2Fb%20..%2Fc/summaries')
      .query(true)
      .reply(200, { data: [] });

    const res = await request(app).get('/api/data/summaries').query({ user_id: 'a/b ../c' });
    expect(res.status).toBe(200);
    expect(scope.isDone()).toBe(true);
  });
});

describe('GET /api/stream/connect', () => {
  test('responds with text/event-stream content-type', (done) => {
    nock('https://inform-streams.test')
      .get('/streams/stream-123/connect')
      .query({ token: 'test-token' })
      .reply(200, 'event: data\ndata: {"type":"summary"}\n\n', {
        'Content-Type': 'text/event-stream',
      });

    const req = request(app).get('/api/stream/connect');
    req.on('response', (res) => {
      expect(res.headers['content-type']).toContain('text/event-stream');
      req.abort();
      done();
    });
    req.end(() => {});
  });

  test('returns 503 when no stream could be created', async () => {
    const original = process.env.INFORM_STREAM_ID;
    delete process.env.INFORM_STREAM_ID;

    const res = await request(app).get('/api/stream/connect');
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/Live streaming unavailable/);

    process.env.INFORM_STREAM_ID = original;
  });

  test('emits a stream_error SSE event when upstream responds non-2xx', async () => {
    nock('https://inform-streams.test')
      .get('/streams/stream-123/connect')
      .query({ token: 'test-token' })
      .reply(401, JSON.stringify({ error: 'invalid token' }));

    const res = await request(app).get('/api/stream/connect');
    expect(res.text).toContain('event: stream_error');
    expect(res.text).toContain('"status":401');
    expect(res.text).toContain('invalid token');
  });
});

describe('GET /api/stream/replay', () => {
  test('responds with text/event-stream content-type', (done) => {
    nock('https://inform-streams.test')
      .get('/replay')
      .query(true)
      .reply(200, 'event: data\ndata: {"type":"measurement"}\n\n', {
        'Content-Type': 'text/event-stream',
      });

    const req = request(app).get('/api/stream/replay');
    req.on('response', (res) => {
      expect(res.headers['content-type']).toContain('text/event-stream');
      req.abort();
      done();
    });
    req.end(() => {});
  });
});
