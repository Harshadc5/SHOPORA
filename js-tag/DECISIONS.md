# AIORA JS Tag — Decisions & Roadmap

---

## v0.1 — Current

### What's Built
- `src/tag.js` — full tag scaffolding with working hydration detection,
  idle wait, PII scrubbing, payload assembly, sendBeacon
- `harness/index.html` — simulated retailer cart page with control panel
- `tests/unit/tag.test.js` — 42 unit tests (config, scrubbing, page type, payload shape)
- `tests/fixtures/` — simple, cart, and promo page fixtures

### Configuration Parameters
| Parameter | Default | Notes |
|---|---|---|
| `data-client-id` | required | Retailer unique ID |
| `data-sampling-rate` | `1.0` | Placeholder — always fires for now |
| `data-hydration-timeout` | `3000ms` | Max wait before capturing anyway |
| `data-dom-settle-ms` | `500ms` | DOM quiet period = hydration done |
| `data-endpoint` | `httpbin.org/post` | TODO: replace with ingest.aiora.systems |

### Deliberate Omissions (Placeholder/Stub)
- Sampling gate — scaffolding in place, always proceeds at 1.0
- Session token grouping — generated and included, not yet used
- Signal capture functions — all return empty arrays/null
- Page type classification — URL-pattern only, no DOM signals yet

### Decisions Made
- Capture once per page load only — no continuous monitoring
- No user behavior tracking (no scroll, no clicks, no timers)
- Send on capture complete — not on page unload
- Lost beacon = lost beacon, no retry
- IIFE wrapper for variable isolation
- `text/plain` Blob on sendBeacon to avoid CORS preflight
  (TODO: confirm this decision — currently using application/json)

---

## v0.2 — Planned

**1. Code review — full pass**
Review `src/tag.js` and `tests/unit/tag.test.js` end to end with fresh eyes.
Check for: edge cases not covered by tests, misleading comments, anything
that would surprise a new developer, and whether the test suite actually
proves what it claims to prove. Document findings before making any changes.

   # Fixtures Completed --
      --> There was a issue with version sync (f.e.g running v 0.1.0 , it shows 1.0.0), now its perfectly synced.
      --> One note was there reagrding currently failing but when I ran all the tests, now its working fine. 

    # Ignoring section 2,3 for now, we will work on it later.

**2. PII scrubbing audit**
Research current best practice for client-side PII scrubbing in browser tags
(GDPR, CCPA context). Key questions:
- Are we stripping enough? What about `data-*` attributes with user data
  (e.g. `data-email`, `data-user-id`), hidden input fields, meta tags?
- Are we stripping too much? Does removing all input values break signal
  detection for cart state or checkout form presence?
- Does scrubbing hold up against dynamically injected personalisation content?
- Are there known bypass patterns we should defend against?
Update Section 7 of `tag.js` and unit tests based on findings.

   # Fixtures Completed --
      --> There was a issue with dom captures. DOM taking the data attributes, when html attributes on page elements injects data. I have added a targetedd allow list in scrubPII() which will remove the personal info taken by DOM from klaviyo, loyalty popups,etc. 
      & an alternative is, we can go for -NER (if possible).
      
      # Pros and Cons of Targeted allow list and NER

       PROS of Targeted allow list :-
        Advanced Security and Fast Execution

       CONS of Targeted allow list :-
        High Maintenance - if any change made in retailer side, we have to update our tag too and may be chance for some data loss.


       PROS of NER :-
        It will catch all hidden PII, no need to maintain any record of blocked attributes.

       CONS of NER :-
        May effect on site Performance, sometimes it will remove data even when not requreid.

     # Efficient Solution :- REGEX - Zero Maintenance, No Data loss, High Performance due to fast in speed.
       
      --> Bypass patterns - Meta Tags, our scrubber will completely ignore the meta tags. we should delete the meta tag where the customer personal info does exists.
                          - Query Strings of Url(maximum chances, most of the retailer 
      avoids this), Instead of trying to block specific PII parameters like ?email=, the safest alternate is to either strip ALL query parameters entirely.(instead of https://shopora.com/checkout?email=a@gmail.com&cart=001, the defensive way will be https://shopora.com/checkout).

      # Pros and Cons of Removing Meta Tags and URL Qs

       PROS of Removing Meta Tags :-
        Fast Execution
 
       CONS of Removing Meta Tags :- 
        Loss of page context


       PROS of Removing URL Qs :-
        Fully PII leak prevention, Easy to implement

       CONS of Removing URL Qs :-
        May destroy data analytics (when we have to track whether user came from any offers or promos)

      # Efficient Solution :- OpenGraph Tags - safe as well as good for analytics, 
                             Standard utm tagging - throws away the dangerous attributes.


**3. Playwright browser test suite**
Add a second test layer that runs the tag in a real Chromium browser.
vitest + jsdom tests logic in isolation. Playwright tests actual behavior.

Setup:
```bash
npm install -D playwright @playwright/test
npx playwright install chromium
```
Add to `package.json`: `"test:browser": "playwright test tests/browser"`

The existing `tests/fixtures/` pages (simple-page, cart-page, promo-page)
are stubs — extend them or replace them with realistic page HTML before
writing Playwright tests against them.

Tests to write in `tests/browser/isolation.test.js`:
- `window` object has no new properties after tag fires
- `document.body` and `document.head` are unchanged before and after tag fires
- No event listeners added to `document` or `window`
- No uncaught errors on a clean page or a page with no signals
- Tag does not interfere with a second script on the same page

Tests to write in `tests/browser/performance.test.js`:
- LCP not measurably delayed vs a control page without the tag
- CLS score is 0 with and without the tag
- Beacon fires within `hydrationTimeout + domSettleMs` ms of page load
- Main thread not blocked during capture (no long tasks > 50ms)

   # Fixtures Remaining --
      --> During the playwright browser test suite, 0ut of 9 test cases - 7 are successfully passed. and 2 test cases are currently failing.
      
      test - Beacon fires within `hydrationTimeout + domSettleMs` ms of page load
                 We can update our tag.js code, for the waitForHydration function,  by manually start the settleTimer, immediately start the 500ms countdown when the script loads, rather than waiting for the first mutation to trigger it.

       #Pros and Cons of Updating tag.js code for the waitForHydration function.

        PROS of Updating tag.js :-
         Tag will be faster and more reliable.

        CONS of Updating tag.js :-
         adding lines of code.
       

      test - Main thread not blocked during capture (no long tasks > 50ms)
                 We can use addInscript function and immediately run page.goto (hard refresh).

       #Pros and Cons of addInscript function.

        PROS of addInscript function :-
         Isolated memory space.

        CONS of addInscript function :-
         Doing hard refresh , may increase the test execution time by fraction of ms.

**4. Real retail page testing**
Download rendered HTML snapshots from real retail sites (Shopify, Magento,
WooCommerce, Next.js Commerce) and run the tag against them in Playwright.
Save snapshots to `tests/fixtures/retail-pages/`. Goal: find gotchas before
a real retailer does. Things to look for:
- Does the tag break on unusual DOM structures?
- Does PII scrubbing miss anything on real checkout pages?
- Does hydration detection work on heavy JS-rendered storefronts?
- Does payload size stay reasonable on large DOM pages?
- Any CSP headers that would block the tag or the beacon?
- Does `text/plain` vs `application/json` behave differently across sites?
  (feeds into the Open Question below)
- What DOM patterns reliably identify each page type (cart, checkout, PDP,
  category, SERP) across different retail stacks? Document findings — the
  current `capturePageType()` is URL-pattern only and will misclassify pages
  on headless or custom URL structures. These findings feed directly into the
  stretch goal implementation.

**5. Signal capture implementation — STRETCH GOAL**
Only attempt if items 1–4 are complete. Do not start before retail page
snapshots from item 4 are in hand — they are the best guide for which CSS
selectors actually appear in the wild. Priority order:

- `captureCartState()` — item count, subtotal, promo code field, checkout button state
- `captureFulfillmentOffers()` — free shipping thresholds, delivery promise copy
- `capturePromoBanners()` — announcement bars, hero offers, discount copy
- `capturePageType()` — rewrite using DOM signals from item 4 findings. Current
  implementation is URL-pattern only and will misclassify pages on headless or
  custom URL structures. DOM signals to look for: cart table/drawer (cart),
  payment form (checkout), add-to-cart button + price block (PDP), product grid (category/SERP).
- `captureTiles()` — product grid tiles, sponsored placement count

---

## Backlog (No Version Assigned Yet)

- Sampling gate implementation
- Signal capture: promo_banners
- Signal capture: cart_state
- Signal capture: fulfillment_offers
- Signal capture: tiles
- Signal capture: page type (DOM-based, not just URL)
- Session token grouping across beacons
- Cloudflare Worker ingestion API (ingest.aiora.systems)
- Replace httpbin.org endpoint with real ingestion API
- CDN deployment pipeline (cdn.aiora.systems)
- SRI hash generation for retailer script tags
- Page type classification using DOM signals
- Truncation at 80,000 chars (when connecting to Claude evaluation)
- esbuild production bundle
- Multi-page test harness with shared layout (so the tag is inserted in one place,
  not duplicated per page); add separate routes/pages for category, PDP, cart, and
  checkout to enable proper session coherence testing across page navigations —
  requires a minimal Node/Express server or equivalent template mechanism

---

## Open Questions

### sendBeacon Blob type: `text/plain` vs `application/json`

Currently using `application/json`. Decision needed before the Cloudflare
Worker at `ingest.aiora.systems` is built.

--> I decided to change the type to text/pain and hosted on vercel because I want to just validate  the tag functionality (checking whether the dom size  needs to be updated or not), We can discuss this once we begin the testing phase.

  I used the text/plain type, just to skip the CORS preflight check (bypass the preflight rules) by cutting out the server load. 

  Cloudflare worker and Vercel's Edge Functions are built on the exact same V8 Isolate technology. Vercel is more developer-friendly and all-in-one platform, so I decided to use Vercel for now.

**The CORS preflight problem**

Browsers classify HTTP requests as either "simple" or "preflighted". A simple
request goes straight through. A preflighted request sends an OPTIONS request
first, waits for the server to approve it, then sends the actual request.

`application/json` is not a simple content type. Every `sendBeacon` call with
`application/json` triggers:
1. OPTIONS preflight → `ingest.aiora.systems`
2. Server responds with CORS headers
3. Actual POST → `ingest.aiora.systems`

That is two network requests per page load, per visitor, at scale.

`text/plain` is a simple content type. No preflight. One request.

**Why this matters for a retailer tag**

The tag fires on every page load across all of a retailer's traffic.
At 1M page views/day, switching from `application/json` to `text/plain`
eliminates 1M OPTIONS requests per day — half the inbound traffic to the
Worker, at zero cost to payload fidelity (the body is still JSON either way).

It also removes a failure mode: if the Worker's CORS preflight response is
misconfigured or slow, `application/json` beacons fail silently. `text/plain`
beacons have no preflight to fail.

**The case for keeping `application/json`**

Semantically correct. Some WAFs and API gateways route or validate on
Content-Type. If the ingestion pipeline ever needs content negotiation
(e.g. accepting msgpack vs JSON in future), the Content-Type header is
the right place to express that.

**Recommendation**

Do not switch until the real retail page testing in v0.2 (work item 4) is
complete. If the sampled retail sites show no CSP or WAF behaviour that
depends on Content-Type, switch to `text/plain` at that point. If any sites
block or mangle `text/plain` beacons in a way that `application/json` would
not, keep `application/json` and accept the preflight cost.

**What needs to change**

In `src/tag.js` Section 10, change:
```js
const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
```
to:
```js
const blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
```

The Cloudflare Worker must still set `Access-Control-Allow-Origin: *` on
POST responses (browsers still enforce CORS on the response even for simple
requests — they just skip the preflight). No OPTIONS handler needed.
