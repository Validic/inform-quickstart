'use strict';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================
// CURL COPY BUTTONS
// ============================================================

let curlCommands = {};

function copyCurl(btn, text) {
  if (!text) return;
  navigator.clipboard.writeText(text);
  const original = btn.textContent;
  btn.textContent = '✓ copied';
  btn.classList.add('copied');
  setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1500);
}

async function loadCurlCommands() {
  const res = await fetch(`/api/curl?user_id=${encodeURIComponent(selectedUserId || '')}`);
  curlCommands = await res.json();
}

// Curl button listeners attached once — handlers read curlCommands at click time
document.getElementById('curl-apps').addEventListener('click', (e) => copyCurl(e.currentTarget, curlCommands.apps));
document.getElementById('curl-connect').addEventListener('click', (e) => copyCurl(e.currentTarget, curlCommands.stream_connect));
document.getElementById('curl-replay').addEventListener('click', (e) => copyCurl(e.currentTarget, curlCommands.stream_replay));

// ============================================================
// USER SELECTOR
// ============================================================

let selectedUserId = null;

async function loadUsers() {
  const [usersRes, statusRes] = await Promise.all([
    fetch('/api/users'),
    fetch('/api/status'),
  ]);
  const { users } = await usersRes.json();
  const status = await statusRes.json();
  const select = document.getElementById('user-select');

  if (users.length === 0) {
    select.innerHTML = '<option>No users found</option>';
    return;
  }

  select.innerHTML = users
    .map((u) => {
      const label = u.uid ? `${escapeHtml(u.uid)} (${escapeHtml(u.id)})` : escapeHtml(u.id);
      return `<option value="${escapeHtml(u.uid || u.id)}">${label}</option>`;
    })
    .join('');

  // Default to the user ensureUser picked on boot (held in memory, not written to .env)
  const defaultId = status.user_id || users[0].uid || users[0].id;
  select.value = defaultId;
  // Fall back to first option if defaultId didn't match any option value
  if (!select.value) select.value = select.options[0].value;
  selectedUserId = select.value;
  select.disabled = false;

  const link = document.getElementById('marketplace-link');
  if (status.marketplace_url) link.href = status.marketplace_url;

  select.addEventListener('change', () => {
    selectedUserId = select.value;
    dataCache = {};
    loadApps();
    loadDataTab(activeDataType);
    loadCurlCommands();
  });
}

// ============================================================
// CONNECTED APPS (Step 2)
// ============================================================

async function loadApps() {
  const res = await fetch(`/api/apps?user_id=${encodeURIComponent(selectedUserId || '')}`);
  const apps = await res.json();

  const synced = Array.isArray(apps) ? apps.filter((a) => a.synced) : [];
  const grid = document.getElementById('apps-grid');
  const empty = document.getElementById('apps-empty');

  grid.innerHTML = '';
  empty.hidden = true;

  if (synced.length === 0) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  grid.innerHTML = synced
    .map(
      (a) => `
      <div class="app-card">
        <img src="${a.logo_url || ''}" alt="${escapeHtml(a.name)}" onerror="this.style.display='none'">
        <span class="app-name">${escapeHtml(a.name)}</span>
        <span class="app-sync">Last sync: ${
          a.last_sync ? new Date(a.last_sync).toLocaleDateString() : 'Never'
        }</span>
      </div>`
    )
    .join('');
}

// Refresh apps when developer returns to this tab after connecting a device
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') loadApps();
});

// ============================================================
// DATA TABS (Step 3)
// ============================================================

let dataCache = {};
let activeDataType = 'summaries';

function formatMetrics(metrics) {
  if (!Array.isArray(metrics) || metrics.length === 0) return '—';
  return metrics
    .map((m) => `${escapeHtml(m.type)}: ${escapeHtml(String(m.value))} ${escapeHtml(m.unit)}`)
    .join(' · ');
}

function renderTable(records) {
  if (!records || records.length === 0) {
    return '<p class="empty-state">No data found for this period.</p>';
  }
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Source</th>
          <th>Metrics</th>
        </tr>
      </thead>
      <tbody>
        ${records
          .map(
            (r) => `
          <tr>
            <td class="muted">${new Date(r.start_time).toLocaleDateString()}</td>
            <td>${r.source?.type || '—'}</td>
            <td>${formatMetrics(r.metrics)}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>`;
}

async function loadDataTab(type) {
  const container = document.getElementById('data-container');
  container.innerHTML = '<p class="empty-state">Loading...</p>';

  if (dataCache[type]) {
    container.innerHTML = renderTable(dataCache[type]);
    return;
  }

  const res = await fetch(`/api/data/${type}?user_id=${encodeURIComponent(selectedUserId || '')}`);
  const body = await res.json();
  const records = body.data || [];
  dataCache[type] = records;
  container.innerHTML = renderTable(records);
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    if (!tab.dataset.type) return;
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    activeDataType = tab.dataset.type;
    loadDataTab(activeDataType);
  });
});

document.getElementById('curl-data').addEventListener('click', (e) => {
  copyCurl(e.currentTarget, curlCommands[activeDataType]);
});

// ============================================================
// LIVE STREAM (Step 4)
// ============================================================

let activeSource = null;
let eventCount = 0;

function formatEvent(eventType, data) {
  let parsed;
  try { parsed = JSON.parse(data); } catch { return null; }

  const eventDate = parsed.start_time ? new Date(parsed.start_time) : new Date();
  const timestamp = eventDate.toLocaleDateString() + ' ' + eventDate.toLocaleTimeString();

  if (eventType === 'data') {
    const metrics = formatMetrics(parsed.metrics);
    const source = parsed.source?.type || '—';
    const userId = parsed.user?.user_id ? `<span class="muted"> (user: ${escapeHtml(parsed.user.user_id)})</span>` : '';
    return `<div class="event-row">
      <span class="ev-data">[data]</span>
      <span class="ev-source"> ${escapeHtml(source)}</span> → ${escapeHtml(parsed.type)}: ${metrics}${userId}
      <span class="muted"> ${timestamp}</span>
    </div>`;
  }

  if (eventType === 'connection') {
    return `<div class="event-row">
      <span class="ev-connection">[connection]</span>
       ${escapeHtml(parsed.source)} ${escapeHtml(parsed.event)}
      <span class="muted"> ${timestamp}</span>
    </div>`;
  }

  if (eventType === 'rule') {
    return `<div class="event-row">
      <span class="ev-rule">[rule]</span>
       rule ${escapeHtml(parsed.rule_id)} triggered
      <span class="muted"> ${timestamp}</span>
    </div>`;
  }

  return null;
}

function appendEvent(eventType, data) {
  const feed = document.getElementById('event-feed');
  const html = formatEvent(eventType, data);
  if (!html) return;

  const placeholder = feed.querySelector('.feed-empty');
  if (placeholder) placeholder.remove();

  feed.insertAdjacentHTML('beforeend', html);
  feed.scrollTop = feed.scrollHeight;

  eventCount += 1;
  document.getElementById('event-counter').textContent = `${eventCount} events`;
}

function openStream(endpoint) {
  if (activeSource) activeSource.close();

  activeSource = new EventSource(endpoint);

  activeSource.addEventListener('data',       (e) => appendEvent('data', e.data));
  activeSource.addEventListener('connection', (e) => appendEvent('connection', e.data));
  activeSource.addEventListener('rule',       (e) => appendEvent('rule', e.data));

  document.getElementById('btn-connect').hidden    = true;
  document.getElementById('btn-replay').hidden     = true;
  document.getElementById('btn-disconnect').hidden = false;
}

function closeStream() {
  if (activeSource) { activeSource.close(); activeSource = null; }
  document.getElementById('btn-connect').hidden    = false;
  document.getElementById('btn-replay').hidden     = false;
  document.getElementById('btn-disconnect').hidden = true;
}

document.getElementById('btn-connect').addEventListener('click', () => {
  openStream('/api/stream/connect');
});

document.getElementById('btn-replay').addEventListener('click', () => {
  eventCount = 0;
  document.getElementById('event-counter').textContent = '0 events';
  document.getElementById('event-feed').innerHTML = '<span class="feed-empty">Replaying...</span>';
  openStream('/api/stream/replay');
});

document.getElementById('btn-disconnect').addEventListener('click', closeStream);

// ============================================================
// INIT
// ============================================================

loadUsers().then(() => {
  loadCurlCommands();
  loadApps();
  loadDataTab('summaries');
}).catch(() => {
  const select = document.getElementById('user-select');
  select.innerHTML = '<option>● Server not responding</option>';
});
