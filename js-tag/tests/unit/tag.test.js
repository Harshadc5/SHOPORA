/**
 * AIORA JS Tag — Unit Tests
 *
 * Tests core tag functions in isolation using jsdom.
 * Does not test sendBeacon (network) or MutationObserver (timing).
 * Those are covered by the harness (manual) and integration tests (later).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const TAG_SOURCE = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../src/tag.js'),
  'utf-8'
);


// ================================================================
// TEST HELPERS
// ================================================================

/**
 * Runs the actual tag source in an isolated jsdom window.
 * Mocks document.currentScript (null in eval contexts without this)
 * and navigator.sendBeacon (not implemented in jsdom).
 * Replaces win.setTimeout/clearTimeout with a controlled queue so
 * tests can drain timers synchronously via drainTimers().
 * Pass beforeEval to mutate the window before the tag executes.
 */
function runTagInWindow(scriptAttrs = {}, { beforeEval } = {}) {
  const attrs = {
    'data-client-id': 'test-retailer-001',
    'data-sampling-rate': '1.0',
    'data-hydration-timeout': '50',
    'data-dom-settle-ms': '10',
    'data-endpoint': 'https://httpbin.org/post',
    ...scriptAttrs,
  };

  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://test-retailer.com/cart',
    runScripts: 'dangerously',
  });

  const win = dom.window;
  const doc = win.document;

  const scriptEl = doc.createElement('script');
  Object.entries(attrs)
    .filter(([, v]) => v !== undefined)
    .forEach(([k, v]) => scriptEl.setAttribute(k, String(v)));
  doc.head.appendChild(scriptEl);

  Object.defineProperty(doc, 'currentScript', {
    get: () => scriptEl,
    configurable: true,
  });

  const sendBeacon = vi.fn().mockReturnValue(true);
  Object.defineProperty(win.navigator, 'sendBeacon', {
    value: sendBeacon,
    writable: true,
    configurable: true,
  });

  // Share the timer queue with the jsdom V8 context via navigator.
  // navigator sub-object properties ARE accessible from within eval —
  // confirmed by the sendBeacon mock working. Direct win.setTimeout
  // replacement does NOT work because win is a VM Proxy.
  const pendingTimers = [];
  Object.defineProperty(win.navigator, '_pendingTimers', {
    value: pendingTimers,
    writable: true,
    configurable: true,
  });
  win.navigator._timerId = 0;

  // Override setTimeout from inside the V8 context so the tag sees our mock.
  // 'window' is undefined in this eval context, so we use bare identifiers
  // (navigator, setTimeout) which resolve as globals without needing window.
  win.eval(`
    ;(function () {
      var q   = navigator._pendingTimers;
      var nav = navigator;

      setTimeout = function (fn) {
        var id = nav._timerId++;
        q.push({ id: id, fn: fn, fired: false, cancelled: false });
        return id;
      };

      clearTimeout = function (id) {
        for (var i = 0; i < q.length; i++) {
          if (q[i].id === id) {
            q[i].cancelled = true;
            return;
          }
        }
      };

      requestIdleCallback = function (fn) {
        return setTimeout(fn);
      };
    }());
  `);

  if (beforeEval) beforeEval(win);

  win.eval(TAG_SOURCE);

  function drainTimers() {
    for (let i = 0; i < pendingTimers.length; i++) {
      const timer = pendingTimers[i];
      if (!timer.cancelled && !timer.fired) {
        timer.fired = true;
        timer.fn();
      }
    }
  }

  return { win, dom, sendBeacon, drainTimers, pendingTimers };
}

/**
 * Runs the PII scrubbing logic extracted for unit testing.
 * Mirrors what tag.js does in Section 7.
 */
function scrubPII(html) {
  const dom = new JSDOM(html, { url: 'https://test.com' });
  const doc = dom.window.document;

  doc.querySelectorAll('input, textarea, select').forEach(el => {
    el.removeAttribute('value');
    if (el.tagName === 'TEXTAREA') el.textContent = '';
  });

  doc.querySelectorAll('input[type="password"]').forEach(el => {
    el.removeAttribute('value');
    el.setAttribute('data-aiora-scrubbed', 'true');
  });

  doc.querySelectorAll('script').forEach(el => el.remove());
  doc.querySelectorAll('style').forEach(el => el.remove());

  // Remove PII-carrying data-* attributes — mirrors tag.js Section 7
  const PII_DATA_ATTRS = [
    'data-email', 'data-user-email', 'data-customer-email',
    'data-user-id', 'data-customer-id', 'data-account-id',
    'data-phone', 'data-mobile',
    'data-first-name', 'data-last-name', 'data-full-name',
    'data-address', 'data-postcode', 'data-zip',
  ];
  const piiSelector = PII_DATA_ATTRS.map(a => `[${a}]`).join(',');
  doc.querySelectorAll(piiSelector).forEach(el => {
    PII_DATA_ATTRS.forEach(attr => el.removeAttribute(attr));
  });

  return doc.documentElement.outerHTML;
}

/**
 * Classifies page type from a URL path.
 * Mirrors what tag.js does in capturePageType().
 */
function classifyPageType(path) {
  const p = path.toLowerCase();
  if (p.includes('/cart')) return 'cart';
  if (p.includes('/checkout')) return 'checkout';
  if (p.includes('/search')) return 'serp';
  if (p.includes('/product') ||
    p.includes('/p/') ||
    p.includes('/pdp')) return 'pdp';
  if (p === '/' || p.includes('/home')) return 'homepage';
  return 'category';
}

/**
 * Builds a payload object.
 * Mirrors assemblePayload() in tag.js.
 */
function assemblePayload(config, scrubbedDOM) {
  return {
    schema_version: '0.1.0',
    tag_version: '0.1.0',
    client_id: config.clientId,
    beacon_id: crypto.randomUUID(),
    session_token: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    page: {
      page_type: classifyPageType(config.path ?? '/'),
      page_url: config.url ?? 'https://test.com',
    },
    dom: scrubbedDOM,
    signals: {
      promo_banners: [],
      cart_state: null,
      fulfillment_offers: [],
      tiles: [],
    },
    privacy_metadata: {
      pii_scrubbing_version: '0.1.0',
      local_scrubbing_applied: true,
      inputs_scrubbed: true,
      scripts_removed: true,
      styles_removed: true,
      persistent_storage_used: false,
    },
  };
}


// ================================================================
// TESTS — CONFIG
// ================================================================

describe('Config', () => {

  // config-test-1: missing client-id → tag aborts before any timers fire
  it('aborts and never fires sendBeacon when client-id is missing', () => {
    const { sendBeacon } = runTagInWindow({ 'data-client-id': undefined });
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  // config-test-2: empty string client-id is falsy → same abort path as missing
  it('aborts and never fires sendBeacon when client-id is empty string', () => {
    const { sendBeacon } = runTagInWindow({ 'data-client-id': '' });
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  // config-test-3: parseFloat('abc') → NaN; NaN > anything = false so tag proceeds — must not crash
  it('does not throw when sampling-rate is not a valid number', () => {
    expect(() => runTagInWindow({ 'data-sampling-rate': 'abc' })).not.toThrow();
  });

  // config-test-4: parseInt('abc') → NaN; setTimeout(fn, NaN) treated as 0 — must not crash
  it('does not throw when hydration-timeout is not a valid number', () => {
    expect(() => runTagInWindow({ 'data-hydration-timeout': 'abc' })).not.toThrow();
  });

  // config-test-5: sampling-rate 0.0 with Math.random mocked to 0.5 → gate blocks
  it('does not fire sendBeacon when sampling-rate is 0.0', () => {
    const { sendBeacon } = runTagInWindow(
      { 'data-sampling-rate': '0.0' },
      { beforeEval: win => { win.Math.random = () => 0.5; } }
    );
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  // config-test-6: full pipeline fires — client_id flows through to payload
  it('fires sendBeacon with correct client_id in payload when config is valid', () => {
    const { win, sendBeacon, drainTimers } = runTagInWindow(
      { 'data-client-id': 'retailer-prod-xyz' },
      {
        beforeEval: function (win) {
          // Intercept Blob constructor from inside the jsdom V8 context.
          // jsdom's cross-context Blob has no .text()/.arrayBuffer() from Node.js side,
          // so we capture parts[0] (the raw JSON string) before it gets wrapped.
          win.eval(`
            ;(function () {
              var OrigBlob = Blob;
              Blob = function (parts, opts) {
                navigator._capturedJSON = parts[0];
                return new OrigBlob(parts, opts);
              };
            }());
          `);
        }
      }
    );
    drainTimers();
    expect(sendBeacon).toHaveBeenCalledOnce();
    const payload = JSON.parse(win.navigator._capturedJSON);
    expect(payload.client_id).toBe('retailer-prod-xyz');
  });

  // config-test-7: endpoint config flows through to the sendBeacon call URL
  // NOTE: currently failing — timer control does not reach the jsdom eval context
  it('calls sendBeacon with the configured endpoint URL', () => {
    const { sendBeacon, drainTimers } = runTagInWindow({
      'data-endpoint': 'https://ingest.aiora.systems/v1/signal',
    });
    drainTimers();
    expect(sendBeacon).toHaveBeenCalledOnce();
    expect(sendBeacon.mock.calls[0][0]).toBe('https://ingest.aiora.systems/v1/signal');
  });

});


// ================================================================
// TESTS — PII SCRUBBING
// ================================================================

describe('PII Scrubbing', () => {

  // pii-test-1: text input value is stripped — email address must not appear in output
  it('removes value attribute from input fields', () => {
    const html = `<html><body>
      <input type="text" name="email" value="sarah@example.com">
    </body></html>`;
    const scrubbed = scrubPII(html);
    expect(scrubbed).not.toContain('sarah@example.com');
    expect(scrubbed).not.toContain('value="sarah@example.com"');
  });

  // pii-test-2: password field value stripped
  it('removes value attribute from password fields', () => {
    const html = `<html><body>
      <input type="password" value="supersecret123">
    </body></html>`;
    const scrubbed = scrubPII(html);
    expect(scrubbed).not.toContain('supersecret123');
  });

  // pii-test-3: password fields get a marker attribute so server can verify scrubbing happened
  it('marks password fields with data-aiora-scrubbed', () => {
    const html = `<html><body>
      <input type="password" value="secret">
    </body></html>`;
    const scrubbed = scrubPII(html);
    expect(scrubbed).toContain('data-aiora-scrubbed="true"');
  });

  // pii-test-4: textarea content (free-form customer text) is cleared
  it('removes textarea content', () => {
    const html = `<html><body>
      <textarea name="notes">Private customer note here</textarea>
    </body></html>`;
    const scrubbed = scrubPII(html);
    expect(scrubbed).not.toContain('Private customer note here');
  });

  // pii-test-5: script tags removed entirely — may contain API keys or secrets
  it('removes script tags entirely', () => {
    const html = `<html><body>
      <script>var apiKey = "secret-key-123";<\/script>
      <p>Product page</p>
    </body></html>`;
    const scrubbed = scrubPII(html);
    expect(scrubbed).not.toContain('secret-key-123');
    expect(scrubbed).not.toContain('<script>');
  });

  // pii-test-6: style tags removed — not signals, just noise
  it('removes style tags', () => {
    const html = `<html><body>
      <style>.promo { color: red; }<\/style>
      <div class="promo">Sale!</div>
    </body></html>`;
    const scrubbed = scrubPII(html);
    expect(scrubbed).not.toContain('.promo { color: red; }');
  });

  // pii-test-7: visible page text must survive — this is what AIORA actually needs
  it('preserves visible page text', () => {
    const html = `<html><body>
      <div class="announcement-bar">Up to 30% off sitewide</div>
    </body></html>`;
    const scrubbed = scrubPII(html);
    expect(scrubbed).toContain('Up to 30% off sitewide');
  });

  // pii-test-8: data-* attributes used for signals must survive
  it('preserves data attributes used for signal detection', () => {
    const html = `<html><body>
      <div data-promo="true" data-loyalty-tier="Silver">Sale</div>
    </body></html>`;
    const scrubbed = scrubPII(html);
    expect(scrubbed).toContain('data-promo="true"');
    expect(scrubbed).toContain('data-loyalty-tier="Silver"');
  });

  // pii-test-8b: PII-carrying data-* attributes injected by personalisation
  // platforms (Klaviyo, Salesforce Commerce) must be removed even though
  // safe data-* attributes are preserved. This is the critical gap Fix 3 closes.
  it('removes PII-carrying data-* attributes (data-email, data-user-id, etc)', () => {
    const html = `<html><body>
      <div class="announcement"
           data-email="john.smith@gmail.com"
           data-user-id="USR_8472910"
           data-customer-id="CUST_001"
           data-phone="+91-98765-43210"
           data-user-email="john@example.com"
           data-customer-email="john@example.com"
           data-promo="true">
        Free delivery above ₹799
      </div>
    </body></html>`;
    const scrubbed = scrubPII(html);
    // PII attributes must be gone
    expect(scrubbed).not.toContain('john.smith@gmail.com');
    expect(scrubbed).not.toContain('USR_8472910');
    expect(scrubbed).not.toContain('CUST_001');
    expect(scrubbed).not.toContain('+91-98765-43210');
    expect(scrubbed).not.toContain('data-email');
    expect(scrubbed).not.toContain('data-user-id');
    expect(scrubbed).not.toContain('data-customer-id');
    expect(scrubbed).not.toContain('data-phone');
    expect(scrubbed).not.toContain('data-user-email');
    expect(scrubbed).not.toContain('data-customer-email');
    // Safe signal attributes must survive
    expect(scrubbed).toContain('data-promo="true"');
    // Visible text must survive
    expect(scrubbed).toContain('Free delivery above');
  });

  // pii-test-9: class names must survive — used by signal capture CSS selectors
  it('preserves class names used for signal detection', () => {
    const html = `<html><body>
      <div class="announcement-bar promo-banner">Free shipping over $35</div>
    </body></html>`;
    const scrubbed = scrubPII(html);
    expect(scrubbed).toContain('class="announcement-bar promo-banner"');
  });

  // pii-test-10: scrubber must not crash on a page with no inputs
  it('handles page with no inputs gracefully', () => {
    const html = `<html><body><p>Simple page</p></body></html>`;
    expect(() => scrubPII(html)).not.toThrow();
  });

  // pii-test-11: all input types scrubbed in a single pass — no type is missed
  it('handles multiple input types in one pass', () => {
    const html = `<html><body>
      <input type="text"     value="John Smith">
      <input type="email"    value="john@example.com">
      <input type="password" value="password123">
      <input type="tel"      value="555-1234">
      <textarea>Private notes</textarea>
    </body></html>`;
    const scrubbed = scrubPII(html);
    expect(scrubbed).not.toContain('John Smith');
    expect(scrubbed).not.toContain('john@example.com');
    expect(scrubbed).not.toContain('password123');
    expect(scrubbed).not.toContain('555-1234');
    expect(scrubbed).not.toContain('Private notes');
  });

});


// ================================================================
// TESTS — PAGE TYPE CLASSIFICATION
// ================================================================

describe('Page Type Classification', () => {

  // page-type-test-1
  it('classifies /cart as cart', () => {
    expect(classifyPageType('/cart')).toBe('cart');
  });

  // page-type-test-2
  it('classifies /checkout as checkout', () => {
    expect(classifyPageType('/checkout')).toBe('checkout');
  });

  // page-type-test-3: sub-paths must still match (e.g. /checkout/payment)
  it('classifies /checkout/payment as checkout', () => {
    expect(classifyPageType('/checkout/payment')).toBe('checkout');
  });

  // page-type-test-4: query strings must not confuse the classifier
  it('classifies /search as serp', () => {
    expect(classifyPageType('/search?q=shoes')).toBe('serp');
  });

  // page-type-test-5: /product/ prefix
  it('classifies /product/nike-air as pdp', () => {
    expect(classifyPageType('/product/nike-air-max')).toBe('pdp');
  });

  // page-type-test-6: /p/ short-form PDP slug
  it('classifies /p/12345 as pdp', () => {
    expect(classifyPageType('/p/12345')).toBe('pdp');
  });

  // page-type-test-7: /pdp/ prefix
  it('classifies /pdp/shoe as pdp', () => {
    expect(classifyPageType('/pdp/shoe')).toBe('pdp');
  });

  // page-type-test-8: exact root path
  it('classifies / as homepage', () => {
    expect(classifyPageType('/')).toBe('homepage');
  });

  // page-type-test-9: /home path
  it('classifies /home as homepage', () => {
    expect(classifyPageType('/home')).toBe('homepage');
  });

  // page-type-test-10: unrecognised path falls back to category (the default)
  it('classifies /womens/shoes as category', () => {
    expect(classifyPageType('/womens/shoes')).toBe('category');
  });

  // page-type-test-11: URL is lowercased before matching
  it('is case insensitive', () => {
    expect(classifyPageType('/CART')).toBe('cart');
    expect(classifyPageType('/Checkout')).toBe('checkout');
  });

});


// ================================================================
// TESTS — PAYLOAD SHAPE
// ================================================================

describe('Payload Shape', () => {

  const baseConfig = {
    clientId: 'test-retailer-001',
    path: '/cart',
    url: 'https://test-retailer.com/cart',
  };

  // payload-test-1: schema_version present — server uses this for backwards compat
  // NOTE: tests the local helper's hardcoded value, not the real tag.js version
  it('includes schema_version', () => {
    const payload = assemblePayload(baseConfig, '<html></html>');
    expect(payload.schema_version).toBe('0.1.0');
  });

  // payload-test-2: tag_version present — server uses this for debugging
  // NOTE: same caveat as payload-test-1
  it('includes tag_version', () => {
    const payload = assemblePayload(baseConfig, '<html></html>');
    expect(payload.tag_version).toBe('0.1.0');
  });

  // payload-test-3: client_id flows through from config to payload
  it('includes client_id', () => {
    const payload = assemblePayload(baseConfig, '<html></html>');
    expect(payload.client_id).toBe('test-retailer-001');
  });

  // payload-test-4: beacon_id is a valid UUID v4
  it('includes a valid UUID for beacon_id', () => {
    const payload = assemblePayload(baseConfig, '<html></html>');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(payload.beacon_id).toMatch(uuidRegex);
  });

  // payload-test-5: session_token is a valid UUID v4
  it('includes a valid UUID for session_token', () => {
    const payload = assemblePayload(baseConfig, '<html></html>');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(payload.session_token).toMatch(uuidRegex);
  });

  // payload-test-6: each beacon gets a fresh UUID — deduplication relies on this
  it('generates unique beacon_id on each call', () => {
    const p1 = assemblePayload(baseConfig, '<html></html>');
    const p2 = assemblePayload(baseConfig, '<html></html>');
    expect(p1.beacon_id).not.toBe(p2.beacon_id);
  });

  // payload-test-7: timestamp is a valid ISO 8601 string
  it('includes a valid ISO timestamp', () => {
    const payload = assemblePayload(baseConfig, '<html></html>');
    expect(() => new Date(payload.timestamp)).not.toThrow();
    expect(new Date(payload.timestamp).toISOString()).toBe(payload.timestamp);
  });

  // payload-test-8: page object carries page_type and page_url
  it('includes page object with page_type and page_url', () => {
    const payload = assemblePayload(baseConfig, '<html></html>');
    expect(payload.page).toBeDefined();
    expect(payload.page.page_type).toBe('cart');
    expect(payload.page.page_url).toBe('https://test-retailer.com/cart');
  });

  // payload-test-9: dom field is a non-empty string
  it('includes dom field as a string', () => {
    const payload = assemblePayload(baseConfig, '<html><body>test</body></html>');
    expect(typeof payload.dom).toBe('string');
    expect(payload.dom.length).toBeGreaterThan(0);
  });

  // payload-test-10: signals block has the expected placeholder shape
  it('includes signals block with correct placeholder shape', () => {
    const payload = assemblePayload(baseConfig, '<html></html>');
    expect(payload.signals).toBeDefined();
    expect(Array.isArray(payload.signals.promo_banners)).toBe(true);
    expect(Array.isArray(payload.signals.fulfillment_offers)).toBe(true);
    expect(Array.isArray(payload.signals.tiles)).toBe(true);
    expect(payload.signals.cart_state).toBeNull();
  });

  // payload-test-11: privacy_metadata block is present with correct flags
  it('includes privacy_metadata block', () => {
    const payload = assemblePayload(baseConfig, '<html></html>');
    expect(payload.privacy_metadata).toBeDefined();
    expect(payload.privacy_metadata.local_scrubbing_applied).toBe(true);
    expect(payload.privacy_metadata.persistent_storage_used).toBe(false);
  });

  // payload-test-12: full payload round-trips through JSON cleanly
  it('serializes to valid JSON', () => {
    const payload = assemblePayload(baseConfig, '<html></html>');
    expect(() => JSON.stringify(payload)).not.toThrow();
    expect(() => JSON.parse(JSON.stringify(payload))).not.toThrow();
  });

  // payload-test-13: end-to-end scrub + assemble — no PII survives into final JSON
  it('does not contain PII after scrubbing', () => {
    const dirtyHTML = `<html><body>
      <input type="email" value="customer@example.com">
      <input type="password" value="secret123">
    </body></html>`;
    const scrubbed = scrubPII(dirtyHTML);
    const payload = assemblePayload(baseConfig, scrubbed);
    const json = JSON.stringify(payload);
    expect(json).not.toContain('customer@example.com');
    expect(json).not.toContain('secret123');
  });

});
