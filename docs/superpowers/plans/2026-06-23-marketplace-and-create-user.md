# Marketplace + Create User Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two features to `apps/explorer`: (1) a "Connect Sources" button on UserCards that opens a custom marketplace source-grid modal, and (2) a `create-user` service type that POSTs to Validic to provision a new user.

**Architecture:** Marketplace is self-contained in a new `MarketplaceModal` component with a direct browser fetch (marketplace URL has token embedded, no proxy needed). Create User adds a new service type through the existing service type → requestBuilder → AccordionServicePanel pattern.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind v4, Lucide React

**Working directory:** `apps/explorer`

---

### Task 1: Add `create-user` service type to types

**Files:**
- Modify: `src/types/index.ts:123-195`

- [ ] **Step 1: Add `'create-user'` to the `ServiceType` union**

```typescript
export type ServiceType =
  | 'get-user'
  | 'get-users'
  | 'create-user'
  | 'get-user-data'
  | 'replay-stream'
  | 'generate-data';
```

- [ ] **Step 2: Add service config to `SERVICES` array (after `get-users` entry)**

```typescript
  {
    id: 'create-user',
    name: 'Create User',
    description: 'Provision a new user in the organization',
    icon: 'UserPlus',
    color: '#0088EE',
  },
```

- [ ] **Step 3: Add `'create-user'` to the Users category in `SERVICE_CATEGORIES`**

```typescript
  {
    id: 'users',
    name: 'Users',
    services: ['get-user', 'get-users', 'create-user'],
  },
```

- [ ] **Step 4: Run lint to verify no type errors**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add create-user service type"
```

---

### Task 2: Add `create-user` case to requestBuilder

**Files:**
- Modify: `src/lib/requestBuilder.ts:44-96`

The `create-user` case builds a POST request. If `setup.userId` is empty, that means the caller has already generated a UUID before calling `buildRequest` (see Task 4). The requestBuilder always uses `setup.userId` as-is.

- [ ] **Step 1: Add the `create-user` case to the switch in `buildRequest`**

Add after the `get-users` case (before `get-user-data`):

```typescript
    case 'create-user': {
      const url = `${trimUrl(config.coreUrl)}/organizations/${config.organizationId}/users?token=${config.authToken}`;
      const body = { uid: setup.userId };
      return { method: 'POST', url, headers, body };
    }
```

- [ ] **Step 2: Remove the exhaustive `default` throw so TypeScript is happy** (it already exists — just verify the new case compiles)

Run:
```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/requestBuilder.ts
git commit -m "feat: add create-user request builder case"
```

---

### Task 3: Add `create-user` panel to AccordionServicePanel

**Files:**
- Modify: `src/components/AccordionServicePanel.tsx`

The create-user panel shows a uid input field (same `setup.userId` field used by other services) with a custom placeholder, then the execute button and request preview.

- [ ] **Step 1: Add `UserPlus` to the Lucide imports at the top of the file**

Find the existing lucide-react import line and add `UserPlus` to it.

- [ ] **Step 2: Add `renderCreateUserContent` renderer (after `renderGetUsersContent`)**

```typescript
  const renderCreateUserContent = () => (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <UserPlus className="w-4 h-4" />
          User ID (uid)
        </label>
        <input
          type="text"
          value={setup.userId}
          onChange={(e) => handleChange('userId', e.target.value)}
          placeholder="Leave blank to auto-generate"
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Your reference ID for this user. Must be unique within your org.
        </p>
      </div>
      {renderExecuteButton()}
      {renderRequestPreview('create-user')}
    </div>
  );
```

- [ ] **Step 3: Add `create-user` to `getServiceContent` switch**

```typescript
      case 'create-user':
        return renderCreateUserContent();
```

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/AccordionServicePanel.tsx
git commit -m "feat: add create-user accordion panel"
```

---

### Task 4: Auto-generate UUID for blank uid in InformDemo

**Files:**
- Modify: `src/modules/InformDemo.tsx`

When `create-user` is executed with a blank `userId`, generate a UUID, update the setup state, and use it for the request.

- [ ] **Step 1: Find `handleExecute` in InformDemo.tsx and add UUID generation**

Locate the `handleExecute` (or equivalent) function. Add this block before the `executeApiRequest` call:

```typescript
    let activeSetup = setup;
    if (selectedService === 'create-user' && !setup.userId) {
      const uid = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      activeSetup = { ...setup, userId: uid };
      setSetup(activeSetup);
    }
```

Then replace the `executeApiRequest(config, setup, ...)` call with `executeApiRequest(config, activeSetup, ...)`.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/modules/InformDemo.tsx
git commit -m "feat: auto-generate uid for create-user when blank"
```

---

### Task 5: Create MarketplaceModal component

**Files:**
- Create: `src/components/MarketplaceModal.tsx`

The modal fetches the marketplace JSON directly (the URL has the token embedded — no proxy needed, no auth headers required). It renders a 3-column logo-forward source grid. Connect/Disconnect open links in a new tab. A Refresh button re-fetches to update status.

- [ ] **Step 1: Create the file**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { DataRecord } from '@/types';

interface MarketplaceSource {
  type: string;
  connected: boolean;
  logo_url: string;
  connect_url: string;
  disconnect_url: string;
}

interface MarketplaceModalProps {
  user: DataRecord;
  onClose: () => void;
}

function formatSourceName(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function MarketplaceModal({ user, onClose }: MarketplaceModalProps) {
  const [sources, setSources] = useState<MarketplaceSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    if (!user.marketplace?.url) return;
    setLoading(true);
    setError(null);
    try {
      const redirectUri = encodeURIComponent(window.location.href);
      const url = `${user.marketplace.url}&format=json&redirect_uri=${redirectUri}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load sources (${res.status})`);
      const data = await res.json();
      setSources(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sources');
    } finally {
      setLoading(false);
    }
  }, [user.marketplace?.url]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const userId = user.user?.user_id || user.id || 'Unknown';
  const shortId = userId.length > 12 ? `${userId.slice(0, 8)}…` : userId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-white font-semibold text-base">Connect Sources</h2>
            <p className="text-gray-400 text-xs mt-0.5">User {shortId}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSources}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm py-8 justify-center">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {!loading && !error && sources.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">No sources available.</p>
          )}

          {!loading && !error && sources.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {sources.map((source) => (
                <div
                  key={source.type}
                  className={`relative flex flex-col items-center p-3 rounded-lg border transition-colors ${
                    source.connected
                      ? 'border-green-500/60 bg-green-500/5'
                      : 'border-gray-700 bg-gray-800/50'
                  }`}
                >
                  {source.connected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">✓</span>
                    </div>
                  )}
                  <img
                    src={source.logo_url}
                    alt={formatSourceName(source.type)}
                    className="w-10 h-10 rounded-lg object-contain mb-2"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <p className={`text-xs font-medium mb-2 text-center ${source.connected ? 'text-white' : 'text-gray-400'}`}>
                    {formatSourceName(source.type)}
                  </p>
                  {source.connected ? (
                    <a
                      href={source.disconnect_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                    >
                      Disconnect
                    </a>
                  ) : (
                    <a
                      href={source.connect_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                    >
                      Connect
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/MarketplaceModal.tsx
git commit -m "feat: add MarketplaceModal component"
```

---

### Task 6: Add "Connect Sources" button to UserCard

**Files:**
- Modify: `src/components/UserCard.tsx`

Add a `marketplaceOpen` state, import `MarketplaceModal`, and render a "Connect Sources" button visible at the card level (not inside the expand). Show button only when `user.marketplace` exists.

- [ ] **Step 1: Add `Store` to Lucide imports and import `MarketplaceModal`**

Add `Store` to the existing lucide-react import line.

Add after the existing imports:
```typescript
import MarketplaceModal from '@/components/MarketplaceModal';
```

- [ ] **Step 2: Add `marketplaceOpen` state inside `UserCard`**

After the existing `useState` declarations:
```typescript
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
```

- [ ] **Step 3: Add the button inside the card's header area**

Locate the section inside the card header where action buttons are rendered (around the expand toggle and copy buttons). Add the Connect Sources button after the existing action row, but only when `user.marketplace` exists:

```typescript
              {user.marketplace && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMarketplaceOpen(true); }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 transition-colors"
                >
                  <Store className="w-3 h-3" />
                  Connect Sources
                </button>
              )}
```

- [ ] **Step 4: Render the modal at the bottom of the UserCard return**

Just before the closing `</div>` of the component return:
```typescript
              {marketplaceOpen && (
                <MarketplaceModal
                  user={user}
                  onClose={() => setMarketplaceOpen(false)}
                />
              )}
```

- [ ] **Step 5: Run lint**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 6: Run build to verify no TypeScript errors**

```bash
npm run build
```

Expected: build succeeds

- [ ] **Step 7: Commit**

```bash
git add src/components/UserCard.tsx
git commit -m "feat: add Connect Sources button and marketplace modal to UserCard"
```

---

## Verification

After all tasks are complete:

1. Run `npm run dev` in `apps/explorer`
2. Load a config with a valid org and token
3. Run "Get User" for a user that has marketplace data — verify the "Connect Sources" button appears on their card
4. Click it — verify the modal opens and sources load
5. Switch to "Create User" in the service selector — verify the panel shows a uid input with auto-generate placeholder
6. Execute with a blank uid — verify a UUID is generated and the created user appears in the response panel
7. Execute with a custom uid — verify it uses the typed value
