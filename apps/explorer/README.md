> **Part of the inform-quickstart monorepo.** See the [root README](../../README.md) to compare apps.

# Inform Explorer

A full-featured API workbench for the Inform API. Three-panel UI:
configure credentials on the left, build requests in the middle, inspect
responses on the right.

## Prerequisites

- Node.js 22+
- An Inform account ([sign up free at dashboard.validic.com](https://dashboard.validic.com))

## Setup

**1. Clone this repo**

```bash
git clone https://github.com/validic/inform-quickstart.git
cd inform-quickstart
```

**2. Install dependencies**

```bash
npm --prefix apps/explorer install
```

Or from `apps/explorer/` directly:

```bash
cd apps/explorer
npm install
```

**3. Add your credentials**

```bash
cp apps/explorer/.env.example apps/explorer/.env
```

Open `.env` and fill in:

```
ORG_ID=your_org_id_here
ORG_TOKEN=your_org_token_here
API_URL=<contact your Inform representative>
DATAGEN_URL=<contact your Inform representative>
STREAM_URL=<contact your Inform representative>
```

**4. Start the app**

```bash
npm run explorer
```

Or from `apps/explorer/`: `npm run dev`

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

## API Reference

- Full docs: [developer.validic.com](https://developer.validic.com)
- Agent/LLM reference: [developer.validic.com/agents.txt](https://developer.validic.com/agents.txt)
