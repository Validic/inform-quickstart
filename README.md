# Inform Quickstart

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Two ways to get started building with the [Inform API](https://developer.validic.com). Pick the one that fits:

| App | Best for | Stack |
|---|---|---|
| **quickstart** | Seeing the API work in 5 minutes | Node.js + vanilla HTML |
| **explorer** | A full API workbench with visual UI | Next.js + React |

Both apps require the same credentials — your Org ID and Auth Token. Sign up for a free sandbox at [dashboard.validic.com](https://dashboard.validic.com) to get them.

## Prerequisites

- Node.js 22+
- An Inform account — [sign up free at dashboard.validic.com](https://dashboard.validic.com)

## Get Started

**1. Clone the repo**

```bash
git clone https://github.com/validic/inform-quickstart.git
cd inform-quickstart
```

**2. Add your credentials**

For the **quickstart** app:

```bash
cp apps/quickstart/.env.example apps/quickstart/.env
```

Open `apps/quickstart/.env` and fill in:

```
ORG_ID=your_org_id_here
ORG_TOKEN=your_org_token_here
```

For the **explorer** app:

```bash
cp apps/explorer/.env.example apps/explorer/.env
```

Open `apps/explorer/.env` and fill in:

```
ORG_ID=your_org_id_here
ORG_TOKEN=your_org_token_here
API_URL=<contact your Inform representative>
DATAGEN_URL=<contact your Inform representative>
STREAM_URL=<contact your Inform representative>
```

Both `ORG_ID` and `ORG_TOKEN` are available in your [Inform dashboard](https://dashboard.validic.com).

**3. Run the app**

```bash
npm run quickstart   # installs dependencies and starts the quickstart app
# or
npm run explorer     # installs dependencies and starts the explorer app
```

Open [http://localhost:3000](http://localhost:3000).

## Quickstart

A minimal Express app that demonstrates the four core steps:
provision a user, connect a device, retrieve health data, and stream real-time events.

→ See [apps/quickstart/README.md](apps/quickstart/README.md)

## Explorer

A full-featured API workbench with a three-panel UI: configure credentials,
build and execute API requests, and inspect responses with data visualization.

→ See [apps/explorer/README.md](apps/explorer/README.md)

## API Reference

- Full docs: [developer.validic.com](https://developer.validic.com)
- Agent/LLM reference: [developer.validic.com/agents.txt](https://developer.validic.com/agents.txt)
