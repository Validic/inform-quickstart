'use strict';
const request = require('supertest');
const nock = require('nock');

process.env.ORG_ID = 'test-org';
process.env.ORG_TOKEN = 'test-token';
process.env.VALIDIC_USER_ID = 'user-uid-abc';
process.env.VALIDIC_MARKETPLACE_URL = 'https://marketplace.staging.validic.com?token=token-xyz';
process.env.VALIDIC_STREAM_ID = 'stream-123';

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
      marketplace_url: 'https://marketplace.staging.validic.com?token=token-xyz',
    });
  });
});

describe('GET /api/apps', () => {
  test('returns apps from Validic API', async () => {
    nock('https://api.staging.validic.com')
      .get('/organizations/test-org/users/user-uid-abc/apps')
      .query({ token: 'test-token' })
      .reply(200, [{ name: 'Fitbit', synced: true, last_sync: '2024-01-01T00:00:00Z' }]);

    const res = await request(app).get('/api/apps');
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe('Fitbit');
  });

  test('returns 500 on Validic API failure', async () => {
    nock('https://api.staging.validic.com')
      .get('/organizations/test-org/users/user-uid-abc/apps')
      .query(true)
      .replyWithError('network error');

    const res = await request(app).get('/api/apps');
    expect(res.status).toBe(500);
  });

  test('forwards non-2xx HTTP status from Validic API', async () => {
    nock('https://api.staging.validic.com')
      .get('/organizations/test-org/users/user-uid-abc/apps')
      .query(true)
      .reply(404, 'Not Found');

    const res = await request(app).get('/api/apps');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Validic API error: 404/);
  });
});

describe('GET /api/data/:type', () => {
  test('returns last 30 days of data for valid type', async () => {
    nock('https://api.staging.validic.com')
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
});

describe('GET /api/stream/connect', () => {
  test('responds with text/event-stream content-type', (done) => {
    nock('https://streams.staging.validic.com')
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
});

describe('GET /api/stream/replay', () => {
  test('responds with text/event-stream content-type', (done) => {
    nock('https://streams.staging.validic.com')
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
