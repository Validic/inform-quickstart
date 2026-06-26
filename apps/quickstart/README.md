> **Part of the inform-quickstart monorepo.** See the [root README](../../README.md) to compare apps.

# Inform Quickstart

A working web app that demonstrates the four steps of the [Inform API](https://developer.validic.com):
provision a user, connect a device, retrieve health data, and stream real-time events — all with your own credentials.

Clone it, run it, then use it as the starting point for whatever you want to build.

## Prerequisites

- Node.js 22 or higher
- An Inform account — [sign up free at dashboard.validic.com](https://dashboard.validic.com)

## Setup

**1. Clone this repo**

```bash
git clone https://github.com/validic/inform-quickstart.git
cd inform-quickstart
npm install
```

**2. Add your credentials**

```bash
cp .env.example .env
```

Open `.env` and fill in two values:

```
ORG_ID=your_org_id_here
ORG_TOKEN=your_org_token_here
```

Both are available in your [Inform dashboard](https://dashboard.validic.com).

**3. Start the app**

```bash
npm start
```

On startup, the app finds or creates an Inform user and stream for your org automatically. Open [http://localhost:3000](http://localhost:3000).

## What you're looking at

The app walks through the four-step Inform integration pattern:

| Section | What it demonstrates |
|---------|---------------------|
| **Connect Your Device** | `GET /users/:id/apps` — list connected sources; redirect to Marketplace |
| **Your Data** | `GET /users/:id/:type` — pull 30 days of normalized health data |
| **Live Stream** | SSE via `/streams/:id/connect` — real-time data as it arrives |
| **Replay last 30 days** | SSE via `/replay` — historical events through the same stream interface |

All Inform API calls happen in `server.js`. The frontend only talks to `localhost`.

## Extending this

- **Add a database** — swap `.env` state for SQLite or Postgres to support multiple users
- **Add a frontend framework** — the `public/` folder is plain HTML/JS; drop in React or Vue
- **Add alert rules** — use the [Rules API](https://developer.validic.com) to trigger notifications when thresholds are crossed

## API Reference

- Full docs: [developer.validic.com](https://developer.validic.com)
- Agent/LLM reference: [developer.validic.com/agents.txt](https://developer.validic.com/agents.txt)
