# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance.test.js >> Tag Performance >> Main thread not blocked during capture (no long tasks > 50ms)
- Location: tests\browser\performance.test.js:94:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to content" [ref=e2] [cursor=pointer]:
    - /url: "#mainContent"
  - generic [ref=e3]: Free delivery above $35Easy 7-day returns100% secure payments
  - banner [ref=e4]:
    - generic [ref=e5]:
      - link "SHOPORA home" [ref=e6] [cursor=pointer]:
        - /url: ./index.html
        - text: S
        - generic [ref=e7]: SHOPORAsmart shopping
      - search [ref=e8]:
        - combobox "Search category" [ref=e9]:
          - option "All" [selected]
          - option "Electronics"
          - option "Fashion"
          - option "Home"
          - option "Books"
        - searchbox "Search products" [ref=e10]
        - button "Submit search" [ref=e11]: ⌕
      - navigation "Account links" [ref=e12]:
        - link "Hello, guestAccount" [ref=e13] [cursor=pointer]:
          - /url: "#"
          - text: Hello, guest
          - strong [ref=e14]: Account
        - link "Returns& Orders" [ref=e15] [cursor=pointer]:
          - /url: "#best-deals"
          - text: Returns
          - strong [ref=e16]: "& Orders"
        - link "♡0" [ref=e17] [cursor=pointer]:
          - /url: ./category.html
          - text: ♡
          - strong [ref=e18]: "0"
        - link "🛒0Cart" [ref=e19] [cursor=pointer]:
          - /url: ./cart.html
          - text: 🛒
          - strong [ref=e20]: "0"
          - text: Cart
    - generic "Department shortcuts" [ref=e21]:
      - button "☰ All" [ref=e22]
      - link "Mobiles & Electronics" [ref=e23] [cursor=pointer]:
        - /url: ./category.html?category=electronics
      - link "Fashion" [ref=e24] [cursor=pointer]:
        - /url: ./category.html?category=fashion
      - link "Home & Kitchen" [ref=e25] [cursor=pointer]:
        - /url: ./category.html?category=home
      - link "Books" [ref=e26] [cursor=pointer]:
        - /url: ./category.html?category=books
      - link "Today's Deals" [ref=e27] [cursor=pointer]:
        - /url: "#best-deals"
      - link "Customer Service" [ref=e28] [cursor=pointer]:
        - /url: "#services"
      - text: "Shopora Plus: extra 5% off"
  - main [ref=e29]:
    - generic [ref=e30]:
      - generic [ref=e31]:
        - text: BIG SAVING DAYS
        - heading "Upgrade your everyday for less." [level=1] [ref=e32]
        - paragraph [ref=e33]: Top-rated tech, style and home finds. Great prices, dependable delivery and easy returns—all in one place.
        - generic [ref=e34]:
          - link "Shop all deals" [ref=e35] [cursor=pointer]:
            - /url: ./category.html
          - link "Explore offers" [ref=e36] [cursor=pointer]:
            - /url: "#best-deals"
        - generic [ref=e37]: ✓ Verified products✓ Secure checkout✓ No hidden fees
      - generic [ref=e38]:
        - text: Deal of the day
        - paragraph [ref=e39]: Loading…
        - generic:
          - strong
          - deletion
        - button "Add to cart" [ref=e40]
    - region "Shopping benefits" [ref=e41]:
      - article [ref=e42]:
        - text: 🚚
        - generic [ref=e43]:
          - strong [ref=e44]: Fast delivery
          - text: Free above $35
      - article [ref=e45]:
        - text: ↩
        - generic [ref=e46]:
          - strong [ref=e47]: Easy returns
          - text: 7-day return window
      - article [ref=e48]:
        - text: 🛡
        - generic [ref=e49]:
          - strong [ref=e50]: Secure payments
          - text: Protected checkout
      - article [ref=e51]:
        - text: 💬
        - generic [ref=e52]:
          - strong [ref=e53]: Here to help
          - text: Support when needed
    - generic [ref=e55]:
      - generic [ref=e56]:
        - text: Shop what you love
        - heading "Explore popular categories" [level=2] [ref=e57]
      - link "View all →" [ref=e58] [cursor=pointer]:
        - /url: ./category.html
    - generic [ref=e60]:
      - generic [ref=e61]:
        - text: Limited-time prices
        - heading "Today's best deals" [level=2] [ref=e62]
      - generic [ref=e63]:
        - text: Ends in
        - strong [ref=e64]: 09:42:18
    - generic [ref=e65]:
      - link "UP TO 35% OFF Smart tech. Smarter prices. Shop electronics →" [ref=e66] [cursor=pointer]:
        - /url: ./category.html?category=electronics
        - text: UP TO 35% OFF
        - heading "Smart tech. Smarter prices." [level=2] [ref=e67]:
          - text: Smart tech.
          - text: Smarter prices.
        - text: Shop electronics →
      - link "HOME REFRESH Give every room a fresh new feel. Shop home →" [ref=e68] [cursor=pointer]:
        - /url: ./category.html?category=home
        - text: HOME REFRESH
        - heading "Give every room a fresh new feel." [level=2] [ref=e69]:
          - text: Give every room
          - text: a fresh new feel.
        - text: Shop home →
    - generic [ref=e71]:
      - generic [ref=e72]:
        - text: Picked for you
        - heading "Trending products" [level=2] [ref=e73]
      - link "See everything →" [ref=e74] [cursor=pointer]:
        - /url: ./category.html
    - generic [ref=e75]:
      - generic [ref=e76]:
        - text: SHOPORA INSIDER
        - heading "Deals worth opening your inbox for." [level=2] [ref=e77]
        - paragraph [ref=e78]: Get weekly price drops, new arrivals and member-only offers.
      - generic [ref=e79]:
        - text: Email address
        - textbox "Email address" [ref=e80]:
          - /placeholder: Enter your email address
        - button "Sign me up" [ref=e81]
  - contentinfo [ref=e82]:
    - link "Back to top ↑" [ref=e83] [cursor=pointer]:
      - /url: "#"
    - generic [ref=e84]:
      - generic [ref=e85]:
        - link "SSHOPORA" [ref=e86] [cursor=pointer]:
          - /url: ./index.html
        - paragraph [ref=e87]: Better choices, fair prices and a smoother way to shop.
      - generic [ref=e88]:
        - strong [ref=e89]: Get to know us
        - link "About Shopora" [ref=e90] [cursor=pointer]:
          - /url: "#"
        - link "Careers" [ref=e91] [cursor=pointer]:
          - /url: "#"
        - link "Press" [ref=e92] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e93]:
        - strong [ref=e94]: Customer care
        - link "Help centre" [ref=e95] [cursor=pointer]:
          - /url: "#"
        - link "Returns" [ref=e96] [cursor=pointer]:
          - /url: "#"
        - link "Delivery" [ref=e97] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e98]:
        - strong [ref=e99]: Shop with us
        - link "All products" [ref=e100] [cursor=pointer]:
          - /url: ./category.html
        - link "Your cart" [ref=e101] [cursor=pointer]:
          - /url: ./cart.html
        - link "Checkout" [ref=e102] [cursor=pointer]:
          - /url: ./checkout.html
    - paragraph [ref=e103]: © 2026 SHOPORA · Shopping demo · Privacy · Terms
```

# Test source

```ts
  18  |     await page.waitForTimeout(3000);
  19  |     
  20  |     const cls = await page.evaluate(() => {
  21  |       let clsValue = 0;
  22  |       new PerformanceObserver((entryList) => {
  23  |         for (const entry of entryList.getEntries()) {
  24  |           if (!entry.hadRecentInput) {
  25  |             clsValue += entry.value;
  26  |           }
  27  |         }
  28  |       }).observe({type: 'layout-shift', buffered: true});
  29  |       return clsValue;
  30  |     });
  31  |     
  32  |     expect(cls).toBe(0);
  33  |   });
  34  | 
  35  |   test('Beacon fires within `hydrationTimeout + domSettleMs` ms of page load', async ({ page }) => {
  36  |     let beaconFired = false;
  37  |     
  38  |     // Mock the outbound /collect request to pass
  39  |     await page.route('**/collect', route => {
  40  |       beaconFired = true;
  41  |       route.fulfill({ status: 200, body: 'ok' });
  42  |     });
  43  | 
  44  |     await page.route('**/tag.js', route => route.fulfill({ path: path.resolve(__dirname, '../../../src/tag.js') }));
  45  |     
  46  |     // Provide a page that triggers the tag to fire (has signals, like a cart page)
  47  |     // We replace the relative endpoint with an absolute one so sendBeacon doesn't fail on about:blank
  48  |     const modifiedCartHtml = cartHtml.replace('data-endpoint="/api/collect"', 'data-endpoint="https://shopora-xi-opal.vercel.app/api/collect"');
  49  |     await page.setContent(modifiedCartHtml);
  50  | 
  51  |     // The test explicitly mandates waiting exactly hydrationTimeout (3000) + domSettleMs (500) = 3500ms.
  52  |     // We wait 3500ms max. If the beacon doesn't fire, the test fails.
  53  |     await page.waitForTimeout(3500);
  54  |     
  55  |     expect(beaconFired).toBe(true);
  56  |   });
  57  | 
  58  |   test('LCP not measurably delayed vs a control page without the tag', async ({ page, context }) => {
  59  |     async function getLCP(withTag) {
  60  |       const p = await context.newPage();
  61  |       if (withTag) {
  62  |         await p.route('**/tag.js', route => route.fulfill({ path: path.resolve(__dirname, '../../../src/tag.js') }));
  63  |       }
  64  |       
  65  |       const htmlToLoad = withTag ? promoHtml : promoHtml.replace(/<script src="\.\/tag\.js".*?><\/script>/, '');
  66  |       await p.setContent(htmlToLoad);
  67  |       
  68  |       const lcp = await p.evaluate(async () => {
  69  |         return new Promise((resolve) => {
  70  |           try {
  71  |             new PerformanceObserver((entryList) => {
  72  |               const entries = entryList.getEntries();
  73  |               const lastEntry = entries[entries.length - 1];
  74  |               resolve(lastEntry.startTime);
  75  |             }).observe({type: 'largest-contentful-paint', buffered: true});
  76  |             setTimeout(() => resolve(0), 1000);
  77  |           } catch(e) {
  78  |             resolve(0); // Fallback
  79  |           }
  80  |         });
  81  |       });
  82  |       await p.close();
  83  |       return lcp;
  84  |     }
  85  | 
  86  |     const lcpWithout = await getLCP(false);
  87  |     const lcpWith = await getLCP(true);
  88  |     
  89  |     // The delay should be negligible. We check if the difference is under a reasonable threshold (e.g., 50ms)
  90  |     // Local execution variability is normal, but our tag shouldn't block the paint.
  91  |     expect(Math.abs(lcpWith - lcpWithout)).toBeLessThan(50);
  92  |   });
  93  | 
  94  |   test('Main thread not blocked during capture (no long tasks > 50ms)', async ({ page }) => {
  95  |     await page.route('**/tag.js', route => route.fulfill({ path: path.resolve(__dirname, '../../../src/tag.js') }));
  96  |     
  97  |     // Inject a PerformanceObserver for 'longtask' before adding the script
  98  |     await page.evaluate(() => {
  99  |       window.__longTasks = [];
  100 |       try {
  101 |         const observer = new PerformanceObserver((list) => {
  102 |           for (const entry of list.getEntries()) {
  103 |             window.__longTasks.push(entry.duration);
  104 |           }
  105 |         });
  106 |         observer.observe({entryTypes: ['longtask']});
  107 |       } catch (e) {
  108 |         // Fallback for browsers not supporting longtask
  109 |       }
  110 |     });
  111 | 
  112 |     await page.setContent(promoHtml);
  113 |     await page.waitForTimeout(3000); // Wait for tag to fire
  114 |     
  115 |     const longTasks = await page.evaluate(() => window.__longTasks);
  116 |     // The 'longtask' API only triggers if a task exceeds 50ms.
  117 |     // If our DOM scrubbing takes less than 50ms, this array will be empty.
> 118 |     expect(longTasks.length).toBe(0);
      |                              ^ Error: expect(received).toBe(expected) // Object.is equality
  119 |   });
  120 | });
  121 | 
```