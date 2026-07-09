'use strict';
const nock = require('nock');

process.env.ORG_ID = 'test-org';
process.env.ORG_TOKEN = 'test-token';
process.env.INFORM_API_URL = 'https://inform-api.test';
process.env.INFORM_STREAM_URL = 'https://inform-streams.test';
delete process.env.INFORM_USER_ID;
delete process.env.INFORM_ACCESS_TOKEN;
delete process.env.INFORM_STREAM_ID;

const { ensureUser, ensureStream } = require('../server');

describe('ensureUser', () => {
  beforeEach(() => {
    delete process.env.INFORM_USER_ID;
    delete process.env.INFORM_ACCESS_TOKEN;
    delete process.env.INFORM_MARKETPLACE_URL;
    process.env.ORG_ID = 'test-org';
    process.env.ORG_TOKEN = 'test-token';
    nock.cleanAll();
  });

  test('uses existing user if one is found', async () => {
    nock('https://inform-api.test')
      .get('/organizations/test-org/users?token=test-token')
      .reply(200, {
        users: [{ id: 'user-abc', uid: 'sample-user', marketplace: { token: 'token-xyz', url: 'https://marketplace.validic.com?token=token-xyz' } }],
      });

    await ensureUser();

    expect(process.env.INFORM_USER_ID).toBe('sample-user');
    expect(process.env.INFORM_ACCESS_TOKEN).toBe('token-xyz');
  });

  test('provisions new user if org has no users', async () => {
    nock('https://inform-api.test')
      .get('/organizations/test-org/users?token=test-token')
      .reply(200, { users: [] });

    nock('https://inform-api.test')
      .post('/organizations/test-org/users?token=test-token')
      .reply(201, {
        id: 'user-new',
        uid: 'sample-app-123',
        marketplace: { token: 'token-new', url: 'https://marketplace.validic.com?token=token-new' },
      });

    await ensureUser();

    expect(process.env.INFORM_USER_ID).toBe('sample-app-123');
    expect(process.env.INFORM_ACCESS_TOKEN).toBe('token-new');
  });

  test('always calls API even if INFORM_USER_ID set in env', async () => {
    process.env.INFORM_USER_ID = 'stale-env-user';

    nock('https://inform-api.test')
      .get('/organizations/test-org/users?token=test-token')
      .reply(200, {
        users: [{ id: 'api-user', uid: 'real-user', marketplace: { token: 'tok', url: 'https://marketplace.validic.com?token=tok' } }],
      });

    await ensureUser();
    expect(process.env.INFORM_USER_ID).toBe('real-user');
  });

  test('throws on Inform API error', async () => {
    nock('https://inform-api.test')
      .get('/organizations/test-org/users?token=test-token')
      .reply(401, 'Unauthorized');
    await expect(ensureUser()).rejects.toThrow('Failed to list users: 401');
  });
});

describe('ensureStream', () => {
  beforeEach(() => {
    delete process.env.INFORM_STREAM_ID;
    process.env.ORG_TOKEN = 'test-token';
    nock.cleanAll();
  });

  test('uses existing stream if found', async () => {
    nock('https://inform-streams.test')
      .get('/streams?token=test-token')
      .reply(200, { streams: [{ id: 'stream-existing', name: 'sample-app-stream' }] });

    await ensureStream();

    expect(process.env.INFORM_STREAM_ID).toBe('stream-existing');
  });

  test('creates stream if none found', async () => {
    nock('https://inform-streams.test')
      .get('/streams?token=test-token')
      .reply(200, { streams: [] });

    nock('https://inform-streams.test')
      .post('/streams?token=test-token')
      .reply(201, { id: 'stream-123', name: 'sample-app-stream' });

    await ensureStream();

    expect(process.env.INFORM_STREAM_ID).toBe('stream-123');
  });

  test('warns and continues without stream on list failure', async () => {
    nock('https://inform-streams.test')
      .get('/streams?token=test-token')
      .reply(500, 'internal error');

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(ensureStream()).resolves.toBeUndefined();
    expect(process.env.INFORM_STREAM_ID).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('500'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('internal error'));
    warnSpy.mockRestore();
  });

  test('warns, hints at cleanup, and continues without stream on quota-exceeded 422', async () => {
    nock('https://inform-streams.test')
      .get('/streams?token=test-token')
      .reply(200, { streams: [] });

    nock('https://inform-streams.test')
      .post('/streams?token=test-token')
      .reply(422, JSON.stringify({ errors: { streams: ['maximum number of streams exceeded'] } }));

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(ensureStream()).resolves.toBeUndefined();
    expect(process.env.INFORM_STREAM_ID).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('422'));
    expect(warnSpy.mock.calls.some(([msg]) => /quota/i.test(msg))).toBe(true);
    expect(warnSpy.mock.calls.some(([msg]) => /DELETE/.test(msg))).toBe(true);
    warnSpy.mockRestore();
  });
});

afterAll(() => nock.restore());
