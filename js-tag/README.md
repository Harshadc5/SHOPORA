# AIORA JS Tag

Passive coordination failure signal collector for enterprise retailers.

Runs in retailer visitors' browsers. Captures page-level DOM signals and
sends them to the AIORA ingestion API for policy evaluation.

## Architecture

The tag is a dumb sensor. All intelligence lives server-side.

```
Page loads
  → sampling check (placeholder — 100% for now)
  → wait for hydration (MutationObserver settle + hard cap)
  → wait for browser idle (requestIdleCallback)
  → capture raw DOM
  → PII scrub
  → assemble payload
  → sendBeacon → ingest.aiora.systems
  → done
```

## Installation (Retailer)

```html
<script src="https://cdn.aiora.systems/v1/tag.js"
        data-client-id="retailer-prod-xxxx"
        data-sampling-rate="1.0"
        data-hydration-timeout="3000"
        data-dom-settle-ms="500"
        async>
</script>
```

## Configuration Parameters

| Parameter | Default | Description |
|---|---|---|
| `data-client-id` | required | Retailer's unique identifier |
| `data-sampling-rate` | `1.0` | Fraction of page loads that fire (0.0–1.0). Placeholder — currently always 1.0 |
| `data-hydration-timeout` | `3000` | Max ms to wait for hydration before capturing anyway |
| `data-dom-settle-ms` | `500` | Ms of DOM quiet that signals hydration complete |
| `data-endpoint` | see below | Ingestion API URL |

## Endpoint

**Current (development):** `https://httpbin.org/post`

> ⚠️ TODO: Replace with `https://ingest.aiora.systems/v1/signal` once the
> Cloudflare Worker ingestion API is built. See Engineering Brief Sections 4.1–4.4.

## Development

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Watch mode
npm run test:watch

# Build minified bundle
npm run build
```

## Testing

### Unit Tests

```bash
npm test
```

Tests cover: config reading, PII scrubbing, page type classification, payload shape.

### Harness (Manual)

Open `harness/index.html` with Live Server in VS Code.

The harness loads `src/tag.js` against a simulated retailer cart page
and shows the captured payload in a control panel on the right.

Open DevTools → Network tab and filter by `ping` to see the beacon fire.

### Test Fixtures

`tests/fixtures/` contains three retailer page simulations:

- `simple-page.html` — minimal page, baseline behavior
- `cart-page.html` — cart with promo code fields, loyalty widget
- `promo-page.html` — multiple promo banners, sponsored tiles, OOS products

## Project Structure

```
aiora-js-tag/
├── src/
│   └── tag.js              ← The tag
├── tests/
│   ├── unit/
│   │   └── tag.test.js     ← Unit tests
│   └── fixtures/
│       ├── simple-page.html
│       ├── cart-page.html
│       └── promo-page.html
├── harness/
│   └── index.html          ← Manual test harness
├── vitest.config.js
├── package.json
└── README.md
```

## What's Not Built Yet

- Signal capture functions (placeholders in `src/tag.js` Section 8)
- Sampling gate logic (placeholder in Section 2)
- Session grouping across beacons (placeholder in Section 3)
- Cloudflare Worker ingestion API
- CDN deployment pipeline
- SRI hash generation
- Page type classification beyond URL patterns
