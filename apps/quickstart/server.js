'use strict';
require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const BASE_URL = process.env.INFORM_API_URL;
const STREAM_URL = process.env.INFORM_STREAM_URL;

// Inform API endpoints used by this app:
//   POST   BASE_URL/organizations/:org_id/users          — provision user
//   GET    BASE_URL/organizations/:org_id/users/:id/apps — connected sources
//   GET    BASE_URL/organizations/:org_id/users/:id/:type — health data
//   POST   STREAM_URL/streams                            — create stream
//   GET    STREAM_URL/streams/:id/connect                — live SSE stream
//   GET    STREAM_URL/replay                             — replay SSE stream

// ---------- helpers ----------

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, text: raw }));
    });
    req.on('error', reject);
    req.end();
  });
}

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, text: raw }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function ensureUser() {
  const orgId = process.env.ORG_ID;
  const orgToken = process.env.ORG_TOKEN;

  if (!orgId || !orgToken) {
    throw new Error('ORG_ID and ORG_TOKEN must be set in .env before starting');
  }

  console.log('Checking for existing Inform users...');
  const listRes = await httpsGet(
    `${BASE_URL}/organizations/${orgId}/users?token=${orgToken}`
  );

  if (listRes.status < 200 || listRes.status >= 300) {
    throw new Error(`Failed to list users: ${listRes.status} ${listRes.text}`);
  }

  const listParsed = JSON.parse(listRes.text);
  const users = Array.isArray(listParsed)
    ? listParsed
    : (listParsed.users || listParsed.data || []);

  let userData;
  if (users.length > 0) {
    userData = users[0];
    console.log(`Using existing user: ${userData.id}`);
  } else {
    console.log('No existing users found, provisioning new user...');
    const res = await httpsPost(
      `${BASE_URL}/organizations/${orgId}/users?token=${orgToken}`,
      {
        uid: `sample-app-${Date.now()}`,
        location: { timezone: 'America/New_York', country_code: 'US' },
      }
    );

    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Failed to provision user: ${res.status} ${res.text}`);
    }

    userData = JSON.parse(res.text);
    console.log(`User provisioned: ${userData.id}`);
  }

  process.env.INFORM_USER_ID = userData.uid;
  process.env.INFORM_ACCESS_TOKEN = userData.marketplace.token;
  process.env.INFORM_MARKETPLACE_URL = userData.marketplace.url;
}

async function ensureStream() {
  const orgToken = process.env.ORG_TOKEN;

  if (!orgToken) {
    throw new Error('ORG_TOKEN must be set in .env before starting');
  }

  console.log('Checking for existing Inform streams...');
  const listRes = await httpsGet(`${STREAM_URL}/streams?token=${orgToken}`);

  if (listRes.status < 200 || listRes.status >= 300) {
    throw new Error(`Failed to list streams: ${listRes.status} ${listRes.text}`);
  }

  const listParsed = JSON.parse(listRes.text);
  const streams = Array.isArray(listParsed) ? listParsed : (listParsed.streams || listParsed.data || []);
  const existing = streams.find((s) => s.name === 'sample-app-stream');

  if (existing) {
    process.env.INFORM_STREAM_ID = existing.id;
    console.log(`Using existing stream: ${existing.id}`);
    return;
  }

  console.log('No existing stream found, creating...');
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const res = await httpsPost(
    `${STREAM_URL}/streams?token=${orgToken}`,
    {
      name: 'sample-app-stream',
      start_date: thirtyDaysAgo,
      resource_filter: ['measurement', 'summary', 'workout', 'sleep'],
      event_type_filter: ['data', 'connection'],
    }
  );

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to create stream: ${res.status} ${res.text}`);
  }

  const stream = JSON.parse(res.text);
  process.env.INFORM_STREAM_ID = stream.id;
  console.log(`Stream created: ${stream.id}`);
}

// ---------- routes ----------

function requireProvisioned(req, res, next) {
  if (!process.env.INFORM_USER_ID) {
    return res.status(503).json({ error: 'App not yet provisioned. Run npm start to provision.' });
  }
  next();
}

app.get('/api/status', (req, res) => {
  res.json({
    org_id: process.env.ORG_ID,
    user_id: process.env.INFORM_USER_ID,
    stream_id: process.env.INFORM_STREAM_ID,
    provisioned: !!process.env.INFORM_USER_ID,
    // NOTE: marketplace_url embeds the user access token — treat as sensitive
    marketplace_url: process.env.INFORM_MARKETPLACE_URL || null,
  });
});

app.get('/api/users', async (req, res) => {
  const { ORG_ID, ORG_TOKEN } = process.env;
  try {
    const response = await httpsGet(`${BASE_URL}/organizations/${ORG_ID}/users?token=${ORG_TOKEN}`);
    if (response.status < 200 || response.status >= 300) {
      return res.status(response.status).json({ error: `Inform API error: ${response.status}` });
    }
    const parsed = JSON.parse(response.text);
    console.log('GET /api/users raw keys:', Object.keys(parsed));
    const users = Array.isArray(parsed) ? parsed : (parsed.users || parsed.data || []);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/curl', (req, res) => {
  const { ORG_ID, ORG_TOKEN, INFORM_USER_ID, INFORM_STREAM_ID } = process.env;
  const userId = req.query.user_id || INFORM_USER_ID;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  const u = `${BASE_URL}/organizations/${ORG_ID}/users/${userId}`;
  res.json({
    apps:           `curl "${u}/apps?token=${ORG_TOKEN}"`,
    summaries:      `curl "${u}/summaries?start_date=${thirtyDaysAgo}&end_date=${today}&token=${ORG_TOKEN}"`,
    workouts:       `curl "${u}/workouts?start_date=${thirtyDaysAgo}&end_date=${today}&token=${ORG_TOKEN}"`,
    sleep:          `curl "${u}/sleep?start_date=${thirtyDaysAgo}&end_date=${today}&token=${ORG_TOKEN}"`,
    measurements:   `curl "${u}/measurements?start_date=${thirtyDaysAgo}&end_date=${today}&token=${ORG_TOKEN}"`,
    stream_connect: `curl -N "${STREAM_URL}/streams/${INFORM_STREAM_ID}/connect?token=${ORG_TOKEN}"`,
    stream_replay:  `curl -N "${STREAM_URL}/replay?resources=measurement,summary,workout,sleep&token=${ORG_TOKEN}&date=${thirtyDaysAgo}"`,
  });
});

app.get('/api/apps', requireProvisioned, async (req, res) => {
  const { ORG_ID, ORG_TOKEN, INFORM_USER_ID } = process.env;
  const userId = req.query.user_id || INFORM_USER_ID;
  try {
    const response = await httpsGet(
      `${BASE_URL}/organizations/${ORG_ID}/users/${userId}/apps?token=${ORG_TOKEN}`
    );
    if (response.status < 200 || response.status >= 300) {
      return res.status(response.status).json({ error: `Inform API error: ${response.status}` });
    }
    res.json(JSON.parse(response.text));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const VALID_DATA_TYPES = ['measurements', 'summaries', 'workouts', 'sleep'];

app.get('/api/data/:type', requireProvisioned, async (req, res) => {
  const { type } = req.params;

  if (!VALID_DATA_TYPES.includes(type)) {
    return res.status(400).json({
      error: `Invalid type. Must be one of: ${VALID_DATA_TYPES.join(', ')}`,
    });
  }

  const { ORG_ID, ORG_TOKEN, INFORM_USER_ID } = process.env;
  const userId = req.query.user_id || INFORM_USER_ID;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await httpsGet(
      `${BASE_URL}/organizations/${ORG_ID}/users/${userId}/${type}` +
        `?start_date=${thirtyDaysAgo}&end_date=${today}&token=${ORG_TOKEN}`
    );
    if (response.status < 200 || response.status >= 300) {
      return res.status(response.status).json({ error: `Inform API error: ${response.status}` });
    }
    res.json(JSON.parse(response.text));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function sseProxy(upstreamUrl, req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const upstream = https.get(upstreamUrl, (upstreamRes) => {
    let buffer = '';
    upstreamRes.on('data', (chunk) => {
      buffer += chunk.toString();
      const parts = buffer.split('\n\n');
      buffer = parts.pop(); // keep any incomplete trailing event
      for (const part of parts) {
        const lines = part.split(/\r?\n/);
        if (part && !lines.some((l) => l === 'event: poke')) {
          res.write(part + '\n\n');
        }
      }
    });
    upstreamRes.on('end', () => res.end());
    upstreamRes.on('error', (err) => {
      if (!res.writableEnded) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
        res.end();
      }
    });
  });

  upstream.on('error', (err) => {
    if (!res.writableEnded) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
      res.end();
    }
  });
  req.on('close', () => upstream.destroy());
}

app.get('/api/stream/connect', requireProvisioned, (req, res) => {
  const { ORG_TOKEN, INFORM_STREAM_ID } = process.env;
  sseProxy(
    `${STREAM_URL}/streams/${INFORM_STREAM_ID}/connect?token=${ORG_TOKEN}`,
    req,
    res
  );
});

app.get('/api/stream/replay', requireProvisioned, (req, res) => {
  const { ORG_TOKEN } = process.env;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  sseProxy(
    `${STREAM_URL}/replay?resources=measurement,summary,workout,sleep&token=${ORG_TOKEN}&date=${thirtyDaysAgo}`,
    req,
    res
  );
});

async function start() {
  await ensureUser();
  await ensureStream();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Inform Sample App running at http://localhost:${PORT}`);
    console.log(`User ID: ${process.env.INFORM_USER_ID}`);
    console.log(`Stream ID: ${process.env.INFORM_STREAM_ID}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
}

module.exports = { app, ensureUser, ensureStream };
