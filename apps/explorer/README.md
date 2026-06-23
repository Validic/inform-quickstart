# Inform Explorer

A full-featured API workbench for the Validic Inform API. Three-panel UI:
configure credentials on the left, build requests in the middle, inspect
responses on the right.

## Prerequisites

- Node.js 22+
- A Validic Inform account ([free sandbox](https://api.dashboard.validic.com))

## Setup

**1. Install dependencies**

```bash
cd apps/explorer
npm install
```

**2. Add your credentials**

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
ORG_ID=your_org_id_here
ORG_TOKEN=your_org_token_here
API_URL=https://api.v2.validic.com
DATAGEN_URL=https://datagen.prod.validic.com
```

**3. Start the app**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What you can do

| Section | What it demonstrates |
|---|---|
| **Get User / Get Users** | Provision and list users in your org |
| **Get User Data** | Pull health data by type (summaries, workouts, sleep, nutrition, measurements, intraday, CGM) |
| **Replay Stream** | Stream historical events via SSE |
| **Generate Data** | Trigger synthetic data for testing |

## Extending this

- The three-panel layout is in `src/modules/InformDemo.tsx`
- API execution logic lives in `src/lib/api.ts` and `src/lib/requestBuilder.ts`
- All API calls go through `/api/proxy` to avoid CORS issues
