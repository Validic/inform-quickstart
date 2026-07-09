# Inform Quickstart

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A522-brightgreen.svg)](https://nodejs.org)
[![Tests](https://github.com/Validic/inform-quickstart/actions/workflows/test.yml/badge.svg)](https://github.com/Validic/inform-quickstart/actions/workflows/test.yml)

[Validic Inform](https://developer.validic.com) connects data from hundreds of health apps, wearables, and in-home medical devices, and delivers it to you in one normalized data model. This repo is the fastest way to see that working — two small apps that exercise the API end to end, so you can watch real calls succeed before you write a line of your own integration.

| App | Best for | Stack | Setup |
|---|---|---|---|
| [**quickstart**](apps/quickstart/) | Seeing the four core API calls work in about 5 minutes | Node.js + Express, vanilla HTML | Org ID + token, nothing else |
| [**explorer**](apps/explorer/) | A full API workbench — build requests, inspect responses, generate synthetic test data | Next.js + React | Org ID + token; Data Generator URL optional |

New to Inform? Start with **quickstart** to learn the shape of the API. Move to **explorer** when you need to poke at every endpoint or test your data handling against realistic payloads.

> **Local development tools only.** These sample apps are meant to run on your machine. The explorer app's API routes proxy requests using your credentials, so don't deploy it to a public URL as-is.

## Prerequisites

- Node.js 22+
- An Inform account — [sign up free at dashboard.validic.com](https://dashboard.validic.com)
- Your **Org ID** and **Org Token**, both visible on your [dashboard](https://dashboard.validic.com)

## Get started

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

`DATAGEN_URL` is optional — without it, everything works except the explorer's Generate Data panel. Your `.env` files are gitignored; keep them that way. The API authenticates with a `token` query parameter, so treat your token like a password — it will appear in URLs, logs, and any curl command you copy.

**3. Run an app**

```bash
npm run quickstart   # installs dependencies and starts the quickstart app
# or
npm run explorer     # installs dependencies and starts the explorer app
```

On boot, the quickstart app provisions what it needs and tells you so:

```
Checking for existing Inform users...
Using existing user: 59b02bdef758800001e13e8c
Checking for existing Inform streams...
Stream created: 6a4ec486baefa8000148a676
Inform Sample App running at http://localhost:3000
```

**4. Open [http://localhost:3000](http://localhost:3000)**

## What the quickstart app shows you

Four panels, four core API capabilities. Every panel has a **copy curl** button that gives you the exact request the app just made — run it yourself, change it, break it, learn from it.

| Panel | API call | What it demonstrates |
|---|---|---|
| Connect Your Device | `GET /organizations/:org/users/:uid` | Connected sources, read from the user's `sources` array; links to the device marketplace |
| Your Data | `GET .../users/:uid/:type` | 30 days of normalized data — summaries, workouts, sleep, measurements |
| Live Stream | `GET /streams/:id/connect` (SSE) | Events arriving in real time |
| Replay last 30 days | `GET /replay` (SSE) | Historical events through the same stream interface |

Together they walk the pattern every real integration follows:

1. **Provision a user** — you get back a `marketplace.url` for that user
2. **Connect a device** — open the marketplace URL and authorize a source (the app does this via the "Connect a device or app" button)
3. **Wait a moment** — first sync can take a couple of minutes depending on the source; an empty `data` array right after connecting is normal
4. **Verify two ways** — pull the data over REST *and* confirm the same event arrived on your stream

The full testing walkthrough — including device-specific steps and generating synthetic test data — lives in the guides at [developer.validic.com](https://developer.validic.com).

## What the explorer app adds

A three-panel workbench: API setup on the left, request builder in the middle, live response viewer on the right.

- **Every users endpoint** — get, list (with pagination and sorting), provision
- **Every data type** — summaries, workouts, sleep, nutrition, measurements, intraday, CGM
- **Stream replay** over SSE
- **Generate Data** — create realistic synthetic records for a user without owning the device (requires a Data Generator URL from your Inform representative)
- Live request preview (method, URL, headers, body) before you execute, and copy-as-curl on everything

## Repo layout

```
inform-quickstart/
├── apps/
│   ├── quickstart/     # Express app — four core calls, minimal code to read
│   │   ├── server.js   # every API call the app makes, in one file
│   │   ├── public/     # vanilla HTML/JS frontend
│   │   └── tests/
│   └── explorer/       # Next.js API workbench
│       └── src/
├── agents.txt          # pointers for AI coding agents
└── package.json        # npm run quickstart / npm run explorer
```

## Troubleshooting

| Symptom | What's going on |
|---|---|
| `404` from `GET /users/<id>` | The single-user endpoint is keyed by **uid** (the identifier you chose at provisioning), not the Validic `id`. Data endpoints accept either. |
| `422 maximum number of streams exceeded` on boot | Orgs are capped at 5 streams. The app still starts (live streaming disabled) and the logs print the curl commands to list and delete old streams. |
| Empty `data` right after connecting a device | Expected — first sync can take up to a couple of minutes depending on the source. |
| Explorer asks for a config upload | Its `.env` needs `ORG_ID`, `ORG_TOKEN`, and `API_URL` at minimum. `DATAGEN_URL` is optional and only gates the Generate Data panel. |
| Lots of requests failing at once | Rate limit is 2,000 requests per token per hour — fine for manual testing, worth knowing if you script anything. |

## Learn more

- **API reference and guides:** [developer.validic.com](https://developer.validic.com)
- **For AI agents:** [developer.validic.com/llms.txt](https://developer.validic.com/llms.txt) — every docs page in Markdown plus the OpenAPI spec
- **Dashboard / free sandbox:** [dashboard.validic.com](https://dashboard.validic.com)

## License

MIT — see [LICENSE](LICENSE).
