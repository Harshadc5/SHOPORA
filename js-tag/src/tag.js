/**
 * AIORA JS Tag — v0.1.0
 *
 * Passive coordination failure signal collector.
 * Runs in retailer visitors' browsers. Captures page-level DOM signals
 * and sends them to the AIORA ingestion API for policy evaluation.
 *
 * Installation:
 *   <script src="https://cdn.aiora.systems/v1/tag.js"
 *           data-client-id="retailer-prod-xxxx"
 *           data-sampling-rate="1.0"
 *           data-hydration-timeout="3000"
 *           data-dom-settle-ms="500"
 *           async>
 *   </script>
 *
 * Architecture:
 *   - All intelligence lives server-side. This tag is a dumb sensor.
 *   - Never modifies the retailer's DOM.
 *   - Never blocks page render.
 *   - Fails silently — any error must be invisible to the retailer's page.
 *   - One beacon per page load only.
 */

(function () {
  try {

    // ================================================================
    // SECTION 1 — CONFIG
    // Read configuration from data-* attributes on the script tag.
    // document.currentScript must be read synchronously at parse time —
    // it becomes null inside async callbacks.
    // ================================================================

    const _script = document.currentScript;

    const config = {
      clientId:         _script?.dataset?.clientId                       ?? null,
      samplingRate:     parseFloat(_script?.dataset?.samplingRate        ?? '1.0'),
      hydrationTimeout: parseInt(_script?.dataset?.hydrationTimeout      ?? '3000'),
      domSettleMs:      parseInt(_script?.dataset?.domSettleMs           ?? '500'),

      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      // TODO — CRITICAL: Replace this endpoint before any retailer
      // onboarding. This must point to a Cloudflare Worker at
      // ingest.aiora.systems that:
      //   - Accepts POST /v1/signal
      //   - Validates client_id and API key
      //   - Rejects payloads containing PII patterns
      //   - Returns 202 Accepted immediately (never blocks the tag)
      //   - Queues payload for async policy evaluation
      //   - Sets Access-Control-Allow-Origin: * (CORS)
      // See: AIORA JS Tag Engineering Brief, Sections 4.1–4.4
      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      endpoint: _script?.dataset?.endpoint ?? 'https://httpbin.org/post',
    };

    // Abort if no client ID — tag cannot identify the retailer
    if (!config.clientId) {
      console.warn('[AIORA] No data-client-id found on script tag. Tag will not fire.');
      return;
    }


    // ================================================================
    // SECTION 2 — SAMPLING GATE
    //
    // Controls what percentage of page loads fire a beacon.
    // At 1.0 (default) every page load fires. At 0.1 only 10% fire.
    //
    // Current implementation — simple but flawed:
    //   if (Math.random() > config.samplingRate) return;
    //
    // Math.random() is evaluated independently on every page load.
    // At 10% sampling, a user's cart page might fire but their checkout
    // page may not — producing incomplete, disconnected snapshots instead
    // of coherent sessions. For coordination failure detection this is
    // a real problem: you need the full sequence to detect that a promo
    // on page A caused a threshold miss on page B.
    //
    // Better approach — hash the session token:
    //   The session token (Section 3) is generated once per page load.
    //   To make sampling session-coherent, write the token to
    //   sessionStorage on first visit and reuse it on subsequent pages
    //   (sessionStorage clears on tab close — no persistent storage).
    //   Then derive a stable 0–1 float from the token and use that as
    //   the sampling decision:
    //
    //     const stored = sessionStorage.getItem('_aiora_sid');
    //     const sid = stored ?? sessionToken;
    //     if (!stored) sessionStorage.setItem('_aiora_sid', sid);
    //     const hash = parseInt(sid.replace(/-/g, '').slice(0, 8), 16);
    //     const sample = hash / 0xFFFFFFFF;
    //     if (sample > config.samplingRate) return;
    //
    //   This guarantees all pages in a tab session are either fully
    //   sampled or fully excluded — preserving the signal sequence
    //   AIORA needs to detect coordination failures.
    // ================================================================

    if (Math.random() > config.samplingRate) return; // TODO: replace with session-coherent sampling above


    // ================================================================
    // SECTION 3 — SESSION TOKEN
    //
    // A unique token for this page load. Lives in memory only —
    // never written to localStorage, sessionStorage, or cookies.
    //
    // TODO: Wire session token into cross-beacon grouping
    // when multiple beacons per session are introduced. For now it
    // is generated and included in the payload but not used for grouping.
    // ================================================================

    const sessionToken = crypto.randomUUID();


    // ================================================================
    // SECTION 4 — BEACON GUARD
    // Ensure we only fire once per page load no matter what.
    // ================================================================

    let beaconFired = false;


    // ================================================================
    // SECTION 5 — HYDRATION DETECTION
    //
    // Wait for the page DOM to settle before capturing signals.
    // "Settled" means no DOM mutations for domSettleMs milliseconds.
    // Hard cap at hydrationTimeout ms — capture anyway if DOM never settles.
    //
    // Why: Promo banners, loyalty widgets, and personalization content
    // are injected by JavaScript after initial HTML parse. Capturing
    // too early means missing these signals entirely.
    // ================================================================

    function waitForHydration(onComplete) {
      let settleTimer = null;

      // Fires when DOM has been quiet for domSettleMs — hydration complete
      function onDomSettled() {
        observer.disconnect();
        clearTimeout(hardCap);
        onComplete();
      }

      // Fires on every DOM mutation — resets the settle countdown
      function onDomMutation() {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(onDomSettled, config.domSettleMs);
      }

      // Fires if DOM never settles within hydrationTimeout — capture anyway
      function onHardCapFired() {
        observer.disconnect();
        clearTimeout(settleTimer);
        onComplete();
      }

      const hardCap = setTimeout(onHardCapFired, config.hydrationTimeout);
      const observer = new MutationObserver(onDomMutation);

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }


    // ================================================================
    // SECTION 6 — IDLE WAIT
    //
    // After hydration, wait for browser idle time before doing
    // DOM capture work. Never competes with the page for main thread.
    // Falls back to setTimeout(0) on Safari (no requestIdleCallback).
    // ================================================================

    function waitForIdle(work) {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(work, { timeout: config.hydrationTimeout });
      } else {
        // Safari fallback — yields to browser at least once
        setTimeout(work, 0);
      }
    }


    // ================================================================
    // SECTION 7 — PII SCRUBBING
    //
    // Strip personally identifiable information from the DOM clone
    // before it leaves the browser. Defense in depth — the tag should
    // never capture PII even by accident.
    //
    // What we strip:
    //   - Input value attributes (typed text)
    //   - Password field values
    //   - Script tag contents (executable code, may contain secrets)
    //   - Style tag contents (not signals, just noise)
    //   - PII-carrying data-* attributes (data-email, data-user-id,
    //     data-phone, data-customer-id, etc.) injected by personalisation
    //     platforms such as Klaviyo, Salesforce Commerce, Shopify Plus
    //
    // What we do NOT strip:
    //   - Text content visible on the page (this is what we need)
    //   - Element structure and class names (needed for signal detection)
    //   - Safe signal data-* attributes (data-promo, data-product-id,
    //     data-loyalty-tier, data-page-type, etc.)
    // ================================================================

    function scrubPII(html) {
      // Work on a detached DOM clone — never touch the live page
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      function scrubInputElement(el) {
        el.removeAttribute('value');
        if (el.tagName === 'TEXTAREA') el.textContent = '';
      }

      function scrubPasswordElement(el) {
        el.removeAttribute('value');
        el.setAttribute('data-aiora-scrubbed', 'true');
      }

      // Strip input value attributes (typed text is not a page signal)
      doc.querySelectorAll('input, textarea, select').forEach(scrubInputElement);

      // Extra caution on password fields
      doc.querySelectorAll('input[type="password"]').forEach(scrubPasswordElement);

      // Remove script tags entirely — not signals, potential secrets
      doc.querySelectorAll('script').forEach(function (el) { el.remove(); });

      // Remove style tags — not signals, just noise
      doc.querySelectorAll('style').forEach(function (el) { el.remove(); });

      // Remove PII-carrying data-* attributes injected by personalisation platforms
      // (e.g. Klaviyo, Salesforce Commerce, Shopify Plus customer objects).
      // We keep safe signal attributes (data-promo, data-product-id, data-loyalty-tier).
      // We remove only known PII carriers — a safe, targeted allowlist approach.
      var PII_DATA_ATTRS = [
        'data-email', 'data-user-email', 'data-customer-email',
        'data-user-id', 'data-customer-id', 'data-account-id',
        'data-phone', 'data-mobile',
        'data-first-name', 'data-last-name', 'data-full-name',
        'data-address', 'data-postcode', 'data-zip',
      ];
      var piiSelector = PII_DATA_ATTRS.map(function(a) { return '[' + a + ']'; }).join(',');
      doc.querySelectorAll(piiSelector).forEach(function(el) {
        PII_DATA_ATTRS.forEach(function(attr) { el.removeAttribute(attr); });
      });

      return doc.documentElement.outerHTML;

    }


    // ================================================================
    // SECTION 8 — SIGNAL CAPTURE
    //
    // TODO: Implement each signal capture function.
    // Each function receives the scrubbed DOM document and returns
    // structured signal data or an empty array/object if nothing found.
    //
    // Rules:
    //   - Never throw — wrap in try/catch and return [] on error
    //   - Never modify the DOM — read only
    //   - Return empty array/object if signal type not present on page
    //   - All returned values must be PII-free (scrubbing already ran,
    //     but do not add raw user data back in)
    //
    // Signal types to implement (per Engineering Brief Section 3.2):
    //   - Promo banners (announcement bars, hero offers)
    //   - Discount code fields (presence and state)
    //   - Shipping threshold copy
    //   - Loyalty signals (tier name, program name — not balance)
    //   - Sponsored placement count
    //   - Inventory badges
    //   - Social proof widgets
    //   - Price and markdown state
    //   - Page type (SERP, PDP, Cart, Checkout, Homepage, Category)
    //   - Outcome signals (add-to-cart click, checkout initiation)
    // ================================================================

    function capturePromoBanners(doc) {
      try {
        var banners = [];
        // Announcement bars, promo banners, hero offers
        doc.querySelectorAll('.announcement span, [data-promo], .promo-banner, .hero-offer, .rail-offer').forEach(function (el, i) {
          var text = (el.textContent || '').trim();
          if (!text) return;
          banners.push({
            position:   i,
            text_scrubbed: text.slice(0, 120),
            surface:    el.closest('.announcement') ? 'announcement_bar'
                      : el.closest('.promo-banner') ? 'promo_banner'
                      : el.closest('.hero')         ? 'hero'
                      : 'other',
            claim_type: /free/i.test(text)     ? 'free_offer'
                      : /off|%|save/i.test(text) ? 'discount'
                      : /deal|sale/i.test(text)  ? 'sale'
                      : 'general',
          });
        });
        return banners;
      } catch (e) { return []; }
    }

    function captureCartState(doc) {
      try {
        // Detect which page we're on — cart or checkout (both have cart-level data)
        var isCart     = !!doc.querySelector('.cart-layout, .cart-items, #cartItems');
        var isCheckout = !!doc.querySelector('.checkout-layout, .checkout-summary, #checkoutItems');
        if (!isCart && !isCheckout) return null;

        // ── CART PAGE ──────────────────────────────────────────────
        var lineItems = [];
        if (isCart) {
          // Item count label
          var itemLabel = doc.querySelector('#cartItemLabel');
          var itemCount = itemLabel ? parseInt(itemLabel.textContent) || 0 : 0;

          // Actual cart line items — app.js renders: article.cart-item inside #cartItems
          // Structure: <article class="cart-item"><h3>name</h3><div class="cart-item-price"><strong>price</strong><del>old</del><small>20% off</small></div></article>
          doc.querySelectorAll('#cartItems article.cart-item, #cartItems .cart-item').forEach(function (item) {
            var nameEl     = item.querySelector('h3');
            var priceEl    = item.querySelector('.cart-item-price strong');
            var oldPriceEl = item.querySelector('.cart-item-price del');
            var discountEl = item.querySelector('.cart-item-price small');
            var name       = nameEl     ? nameEl.textContent.trim().slice(0, 80)     : null;
            var price      = priceEl    ? priceEl.textContent.trim().slice(0, 20)    : null;
            var oldPrice   = oldPriceEl ? oldPriceEl.textContent.trim().slice(0, 20) : null;
            var discount   = discountEl ? discountEl.textContent.trim().slice(0, 20) : null;
            if (name) lineItems.push({ name: name, price: price, old_price: oldPrice, discount: discount });
          });

          var subtotalEl = doc.querySelector('#summarySubtotal');
          var subtotal   = subtotalEl ? subtotalEl.textContent.trim().slice(0, 20) : null;
          var shippingBar = doc.querySelector('#shippingProgress, .shipping-progress');
          var promoField  = doc.querySelector('input[name*="discount"], input[name*="coupon"]');
          var checkoutBtn = doc.querySelector('#checkoutButton');

          return {
            page_context:        'cart',
            item_count:          itemCount,
            line_items:          lineItems,
            subtotal:            subtotal,
            promo_field_present: !!promoField,
            checkout_reachable:  !!checkoutBtn,
            shipping_bar_shown:  !!(shippingBar && shippingBar.textContent.trim()),
          };
        }

        // ── CHECKOUT PAGE ──────────────────────────────────────────
        if (isCheckout) {
          // Items shown in checkout summary sidebar (#checkoutItems)
          doc.querySelectorAll('#checkoutItems .mini-cart-item, #checkoutItems [class*="item"], #checkoutItems li').forEach(function (item) {
            var nameEl  = item.querySelector('[class*="name"], span, strong, p');
            var priceEl = item.querySelector('[class*="price"], strong');
            var name    = nameEl  ? nameEl.textContent.trim().slice(0, 80)  : null;
            var price   = priceEl ? priceEl.textContent.trim().slice(0, 20) : null;
            if (name) lineItems.push({ name: name, price: price });
          });

          var subtotalEl  = doc.querySelector('#checkoutSubtotal');
          var totalEl     = doc.querySelector('#checkoutTotal');
          var deliveryEl  = doc.querySelector('#checkoutDelivery');
          var orderBtn    = doc.querySelector('#placeOrderButton, .place-order');
          var paymentOpts = doc.querySelectorAll('input[name="payment"]');
          var selectedPay = null;
          paymentOpts.forEach(function (r) { if (r.checked) selectedPay = r.value; });

          return {
            page_context:        'checkout',
            line_items:          lineItems,
            subtotal:            subtotalEl  ? subtotalEl.textContent.trim().slice(0, 20)  : null,
            total:               totalEl     ? totalEl.textContent.trim().slice(0, 20)     : null,
            delivery_cost:       deliveryEl  ? deliveryEl.textContent.trim().slice(0, 20)  : null,
            order_button_shown:  !!orderBtn,
            payment_options_count: paymentOpts.length,
            selected_payment:    selectedPay,
          };
        }

        return null;
      } catch (e) { return null; }
    }

    function captureFulfillmentOffers(doc) {
      try {
        var offers = [];
        var seen   = {};
        doc.querySelectorAll('.announcement span, .delivery-note, .shipping-progress, [class*="shipping"], [class*="delivery"]').forEach(function (el) {
          var text = (el.textContent || '').trim().slice(0, 120);
          if (!text || seen[text]) return;
          seen[text] = true;

          // Extract numeric threshold (e.g. "Free delivery above ₹799" → 799)
          var numMatch = text.match(/[₹$£€]?\s*(\d[\d,\.]*)/)
          var threshold = numMatch ? parseFloat(numMatch[1].replace(/,/g, '')) : null;

          offers.push({
            text_scrubbed:         text,
            trigger_type:          /free/i.test(text)  ? 'free_shipping'
                                 : /fast|express/i.test(text) ? 'express'
                                 : /tomorrow|next.day/i.test(text) ? 'next_day'
                                 : 'standard',
            threshold_value_bucket: threshold === null ? null
                                  : threshold < 500   ? 'low'
                                  : threshold < 1000  ? 'mid'
                                  : 'high',
          });
        });
        return offers;
      } catch (e) { return []; }
    }

    function captureTiles(doc) {
      try {
        var tiles = [];
        // EXCLUDE recommendation/suggestion sections — only capture primary product grids
        var EXCLUDE = ['#recommendedGrid', '.cart-recommendations', '#suggestedGrid'];

        doc.querySelectorAll('.product-card, [data-product], .product-tile').forEach(function (card, i) {
          // Skip if this card lives inside a recommendations section
          for (var e = 0; e < EXCLUDE.length; e++) {
            if (card.closest(EXCLUDE[e])) return;
          }

          // Name
          var nameEl  = card.querySelector('h3, .product-name, [class*="name"]');
          var name    = nameEl ? nameEl.textContent.trim().slice(0, 80) : null;

          // Brand
          var brandEl = card.querySelector('.product-brand, [class*="brand"]');
          var brand   = brandEl ? brandEl.textContent.trim().slice(0, 40) : null;

          // Price (current)
          var priceEl = card.querySelector('.price-stack strong, [class*="price"] strong, .price');
          var price   = priceEl ? priceEl.textContent.trim().slice(0, 20) : null;

          // Old/struck price (markdown signal)
          var oldEl    = card.querySelector('.price-stack del, del, [class*="old-price"]');
          var oldPrice = oldEl ? oldEl.textContent.trim().slice(0, 20) : null;

          // Discount badge
          var badgeEl = card.querySelector('.discount-badge, [class*="badge"], [class*="deal"]');
          var badge   = badgeEl ? badgeEl.textContent.trim().slice(0, 30) : null;

          // Out-of-stock signal
          var addBtn  = card.querySelector('.add-to-cart, [class*="add-to-cart"]');
          var inStock = addBtn ? !addBtn.disabled : true;

          if (!name) return; // skip skeleton/empty cards

          tiles.push({
            position:     tiles.length,
            name:         name,
            brand:        brand,
            price:        price,
            old_price:    oldPrice,
            badge:        badge,
            in_stock:     inStock,
            has_markdown: !!(oldPrice && oldPrice !== price),
          });
        });
        return tiles;
      } catch (e) { return []; }
    }

    function capturePageType() {
      // Read explicit page type hint set by the retailer on <body data-page-type="...">
      // This is the most reliable method — no URL guessing needed.
      const explicit = document.body?.dataset?.pageType;
      if (explicit) return explicit;

      // Fallback: URL-pattern based classification (for sites without data-page-type)
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/cart'))     return 'cart';
      if (path.includes('/checkout')) return 'checkout';
      if (path.includes('/search'))   return 'serp';
      if (path.includes('/product') ||
          path.includes('/p/') ||
          path.includes('/pdp'))      return 'pdp';
      if (path === '/' ||
          path.includes('/home'))     return 'homepage';
      return 'category'; // default
    }


    // ================================================================
    // SECTION 9 — PAYLOAD ASSEMBLY
    // ================================================================

    function assemblePayload(scrubbedDOM) {
      // Parse the scrubbed HTML string into a detached document
      // so all capture functions can query it with querySelectorAll
      const parser = new DOMParser();
      const doc = parser.parseFromString(scrubbedDOM, 'text/html');

      return {
        schema_version: '0.1.0',
        tag_version:    '0.1.0',
        client_id:      config.clientId,
        beacon_id:      crypto.randomUUID(),
        session_token:  sessionToken,
        timestamp:      new Date().toISOString(),

        page: {
          page_type: capturePageType(),
          page_url:  window.location.href,
        },

        // Raw DOM — used by server-side Claude evaluation
        // in lieu of Browserless until signal capture is implemented
        dom: scrubbedDOM,

        // ============================================================
        // SIGNALS — pass the parsed doc to each capture function
        // ============================================================
        signals: {
          promo_banners:      capturePromoBanners(doc),
          cart_state:         captureCartState(doc),
          fulfillment_offers: captureFulfillmentOffers(doc),
          tiles:              captureTiles(doc),
        },

        privacy_metadata: {
          pii_scrubbing_version:     '0.1.0',
          local_scrubbing_applied:   true,
          inputs_scrubbed:           true,
          scripts_removed:           true,
          styles_removed:            true,
          persistent_storage_used:   false,
        },
      };
    }


    // ================================================================
    // SECTION 10 — SEND
    // Fire and forget. Never blocks. Never retries.
    // A lost beacon is a lost beacon by design.
    // ================================================================

    function sendPayload(payload) {
      if (beaconFired) return;
      beaconFired = true;

      const blob = new Blob(
        [JSON.stringify(payload)],
        { type: 'text/plain' }  // text/plain avoids CORS preflight — sendBeacon works cross-origin without server CORS headers
      );

      const queued = navigator.sendBeacon(config.endpoint, blob);

      if (!queued) {
        // Beacon was rejected by browser (payload too large or quota exceeded)
        // Log in dev only — never surface errors to retailer's page
        console.warn('[AIORA] sendBeacon returned false. Beacon was not queued.');
      }
    }


    // ================================================================
    // SECTION 11 — MAIN EXECUTION
    // Wire everything together.
    // ================================================================

    function onIdleReady() {
      const rawDOM      = document.documentElement.outerHTML;
      const scrubbedDOM = scrubPII(rawDOM);
      const payload     = assemblePayload(scrubbedDOM);
      sendPayload(payload);
    }

    function onHydrationComplete() {
      waitForIdle(onIdleReady);
    }

    waitForHydration(onHydrationComplete);


  } catch (e) {
    // Fail silently — any error in the tag must be invisible
    // to the retailer's page and their customers.
    // Never re-throw. Never alert. Never modify the DOM.
  }
}());
