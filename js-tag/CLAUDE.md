# AIORA JS Tag — Claude Code Context

Read this file before doing anything in this project.
It contains the product context, architecture decisions, and current state
that you need to work effectively without re-explanation.

---

## What AIORA Is

AIORA is a coordination failure detection engine for enterprise retailers.
Modern retail stacks are composed of independent systems (promotions engine,
loyalty platform, shipping engine, inventory system) that each make decisions
independently. These decisions frequently conflict in ways no single system
can detect.

Example: A 20% welcome discount brings a $55 cart to $44 — below the $50
free shipping threshold. Two systems, two decisions, unintended compound
outcome. Neither system knows what the other did. AIORA detects this.

---

## What This Project Is

The AIORA JS Tag — a passive browser-side signal collector.

A retailer adds one script tag to their site:

```html
<script src="https://cdn.aiora.systems/v1/tag.js"
        data-client-id="retailer-prod-xxxx"
        data-sampling-rate="1.0"
        data-hydration-timeout="3000"
        data-dom-settle-ms="500"
        async>
</script>
```

The tag runs in every visitor's browser, captures the rendered DOM,
and sends it to AIORA's ingestion API for policy evaluation.

---

## The Single Most Important Architectural Principle

**The tag is a dumb sensor. All intelligence lives server-side.**

The tag must never contain analysis logic. It captures raw signals and
ships them to the backend. Policy evaluation, coordination failure
detection, and arbitration all happen server-side.

This protects AIORA's IP and keeps the tag deployable as a trusted
third-party script.

---

## How the Tag Works (Current v0.1)

```
Page loads
  → sampling check (placeholder — always fires at 1.0 for now)
  → MutationObserver watches DOM for mutations
  → when DOM quiet for domSettleMs (500ms) → hydration complete
  → hard cap at hydrationTimeout (3000ms) regardless
  → requestIdleCallback — wait for browser idle time
  → capture raw DOM (document.documentElement.outerHTML)
  → PII scrub (strip inputs, passwords, scripts, styles)
  → assemble payload
  → sendBeacon → POST to endpoint
  → done — one beacon per page load, never retries
```

---

## Configuration Parameters

| Parameter | Default | Notes |
|---|---|---|
| `data-client-id` | required | Retailer unique ID. Tag aborts if missing. |
| `data-sampling-rate` | `1.0` | 0.0–1.0. Placeholder — always 1.0 for now. |
| `data-hydration-timeout` | `3000` | Max ms to wait for hydration. Configurable per retailer. |
| `data-dom-settle-ms` | `500` | Ms of DOM quiet = hydration done. |
| `data-endpoint` | `https://httpbin.org/post` | **TODO: replace with ingest.aiora.systems** |

---

## Current Endpoint — CRITICAL TODO

The tag currently sends to `https://httpbin.org/post` (a public HTTP
testing service) as a temporary stand-in.

**This must be replaced with a Cloudflare Worker at:**
`https://ingest.aiora.systems/v1/signal`

The Worker needs to:
- Accept POST /v1/signal
- Validate client_id and API key
- Reject payloads containing PII patterns
- Return 202 Accepted immediately (never block the tag)
- Queue payload for async policy evaluation
- Set Access-Control-Allow-Origin: * (CORS)

See AIORA JS Tag Engineering Brief, Sections 4.1–4.4.

---

## Project Structure

```
aiora-js-tag/
├── src/
│   └── tag.js              ← The tag. 11 clearly numbered sections.
├── tests/
│   ├── unit/
│   │   └── tag.test.js     ← 42 unit tests. All passing.
│   └── fixtures/
│       ├── simple-page.html
│       ├── cart-page.html
│       └── promo-page.html
├── harness/
│   └── index.html          ← Simulated retailer page + control panel.
│                              Open with Live Server to test the tag manually.
├── DECISIONS.md            ← Full decisions log and roadmap
├── CLAUDE.md               ← This file
├── vitest.config.js
├── package.json
└── README.md
```

---

## src/tag.js — Section Map

```
Section 1  — Config (reads data-* attributes)
Section 2  — Sampling gate (PLACEHOLDER — intern TODO)
Section 3  — Session token (generated, not yet used for grouping)
Section 4  — Beacon guard (fires once per page load only)
Section 5  — Hydration detection (MutationObserver + hard cap)
Section 6  — Idle wait (requestIdleCallback + Safari fallback)
Section 7  — PII scrubbing (inputs, passwords, scripts, styles)
Section 8  — Signal capture (ALL PLACEHOLDERS — intern TODO)
Section 9  — Payload assembly
Section 10 — Send (sendBeacon)
Section 11 — Main execution (wires everything together)
```

---

## What's Working vs Stubbed

### Working
- IIFE wrapper and fail-silent error handling
- Config reading from data-* attributes
- Hydration detection (MutationObserver + hard cap timer)
- Idle wait (requestIdleCallback + setTimeout fallback)
- PII scrubbing (inputs, passwords, scripts, styles)
- Payload assembly with correct schema
- sendBeacon delivery
- Beacon guard (fires once only)
- 42 unit tests passing

### Stubbed (Placeholder — Not Yet Implemented)
- Sampling gate — Section 2, always proceeds at 1.0
- Session token grouping — Section 3, generated but not used
- Signal capture — Section 8, all functions return empty arrays/null:
  - `capturePromoBanners()` → []
  - `captureCartState()` → null
  - `captureFulfillmentOffers()` → []
  - `captureTiles()` → []
  - `capturePageType()` → URL-pattern only, no DOM signals

---

## Key Decisions (Do Not Reverse Without Discussion)

**Capture strategy**
- Capture once per page load — not continuously
- No user behavior tracking (no scroll depth, no click tracking, no timers)
- No key action triggers — page load is the only trigger
- Send immediately after capture — not on page unload

**Delivery**
- sendBeacon only — fire and forget
- A lost beacon is a lost beacon — no retry, no queue
- Always returns 202 from server — never surfaces errors to retailer

**Privacy**
- PII scrubbing runs client-side before any network request
- Field allowlist enforced in tag (not server-side only)
- No persistent storage — no localStorage, sessionStorage, cookies
- Session token lives in memory only

**Tag behavior**
- Must never modify the retailer's DOM
- Must never add global variables to window
- Must never block page render (async attribute, requestIdleCallback)
- Must fail silently — errors invisible to retailer's page and customers
- IIFE wrapper prevents variable leakage to global scope

---

## Testing

```bash
npm install        # first time only
npm test           # run 42 unit tests
npm run test:watch # watch mode during development
```

### Manual Testing (Harness)
Open `harness/index.html` with VS Code Live Server.
The tag fires automatically. Watch the control panel on the right
for hydration → capture → beacon status.
Open DevTools → Network tab, filter by `ping` to see the beacon.

---

## v0.2 Roadmap

Two Playwright browser test suites:

**`tests/browser/isolation.test.js`**
- Tag leaves window object unchanged (no globals)
- Tag does not modify any DOM elements
- Tag does not add event listeners to retailer elements
- Tag does not throw uncaught errors

**`tests/browser/performance.test.js`**
- Tag does not delay LCP vs control page
- Tag does not increase CLS
- Beacon fires within hydrationTimeout + domSettleMs window
- Main thread not blocked during capture

Setup: `npm install -D playwright @playwright/test && npx playwright install chromium`

---

## Backlog (No Version Assigned)

- Sampling gate implementation (Section 2)
- Signal capture: promo_banners (Section 8)
- Signal capture: cart_state (Section 8)
- Signal capture: fulfillment_offers (Section 8)
- Signal capture: tiles (Section 8)
- Page type classification using DOM signals (Section 8)
- Session token grouping across beacons (Section 3)
- Cloudflare Worker ingestion API (ingest.aiora.systems)
- Replace httpbin.org with real ingestion endpoint
- CDN deployment (cdn.aiora.systems)
- SRI hash generation
- esbuild production bundle (`npm run build`)
- Truncation at 80,000 chars (when connecting to Claude evaluation)

---

## Open Questions

- Confirm sendBeacon Blob type: `text/plain` (no CORS preflight)
  vs `application/json` (triggers preflight). Currently using application/json.
- Should `data-dom-settle-ms` be user-configurable via data attribute?
  Currently hardcoded at 500ms default but not exposed as a config param.

---

## Background — The Existing AIORA Scanner

There is an existing working scanner at scanner.aiora.systems (Vercel).
It accepts retailer URLs, fetches rendered HTML via Browserless.io,
sends to Claude for policy evaluation, emails a PDF report.

The JS Tag replaces the Browserless headless browser step — instead of
AIORA fetching the page, the tag captures it from inside the visitor's
real browser session. The backend Claude evaluation logic is reused as-is.

Key infrastructure: Upstash Redis (policies, candidates), Resend (email),
Anthropic Claude API, Cloudflare (DNS, Workers), Vercel (scanner hosting).

---

*Last updated: v0.1 complete — 42 tests passing*
