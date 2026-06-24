# Marketplace + Create User Design

## Overview

Two new features for `apps/explorer`:

1. **Marketplace** — a "Connect Sources" button on each UserCard that opens a modal showing the user's available health data sources (fetched as JSON from the Validic Custom Marketplace API), with connect/disconnect actions per source.
2. **Create User** — a new `create-user` service type that lets the demo operator provision a new Validic user via POST, with an optional UID field.

---

## Feature 1: Marketplace

### Entry Point

A "Connect Sources" button added to each `UserCard`. The button is visible at the card level (not gated behind expand). It requires `user.marketplace` to exist on the user record; if absent, the button is hidden.

### Data Flow

1. Fetch `user.marketplace.url + &format=json + &redirect_uri=<encoded window.location.href>` via the existing `/api/proxy` route (GET).
2. Parse the JSON array of sources. Each source has: `type`, `connected`, `logo_url`, `connect_url`, `disconnect_url`.
3. Render in a modal.

The proxy is called with the full marketplace URL as the target — the proxy forwards it as-is.

### Modal UI

- Dark modal overlay, dismissible via backdrop click or X button.
- Header: "Connect Sources" with the user's truncated ID.
- Logo-forward grid (3 columns): each card shows the source logo (from `logo_url`), source name (formatted from `type`), and a Connect or Disconnect button.
- Connected sources: green border, "Disconnect" button (red).
- Disconnected sources: default border, "Connect" button (blue).
- Connect/Disconnect open the respective URL in a new tab.
- "Refresh" button re-fetches the JSON to update connection status after returning from OAuth.
- Loading and error states handled inline.

### New File

`src/components/MarketplaceModal.tsx` — self-contained component. Props: `user: DataRecord`, `onClose: () => void`.

### Edits

- `UserCard.tsx` — add "Connect Sources" button; import and render `MarketplaceModal` with state for open/closed.

---

## Feature 2: Create User

### Service Type

Add `create-user` to `ServiceType` union and `SERVICES` array in `types/index.ts`, grouped under Users alongside `get-user` and `get-users`.

### Middle Panel

The existing `AccordionServicePanel` for `create-user` shows a single UID input field:
- Label: "User ID (uid)"
- Placeholder: "Leave blank to auto-generate"
- If blank on execute: generate a UUID client-side before building the request.

### Request

`POST /orgs/{org_id}/users` with body `{ "uid": "..." }`.

The proxy already supports POST bodies. The `requestBuilder` needs a case for `create-user` that sets method to POST and constructs the body.

### Response

Standard response panel display — same as all other services. The created user JSON is shown as-is.

### Edits

- `types/index.ts` — add `'create-user'` to `ServiceType`; add entry to `SERVICES` and Users group.
- `requestBuilder.ts` — add `create-user` case: POST to `/orgs/{org_id}/users`, body `{ uid }`.
- `ServiceSelector.tsx` — no change needed if `SERVICES` drives the selector automatically.

---

## Files Touched

| File | Change |
|------|--------|
| `src/components/MarketplaceModal.tsx` | **Create** — full modal component |
| `src/components/UserCard.tsx` | Add Connect Sources button + modal state |
| `src/types/index.ts` | Add `create-user` service type + config |
| `src/lib/requestBuilder.ts` | Add `create-user` case |
