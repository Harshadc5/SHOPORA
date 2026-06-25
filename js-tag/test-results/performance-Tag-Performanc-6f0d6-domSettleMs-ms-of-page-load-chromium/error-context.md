# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance.test.js >> Tag Performance >> Beacon fires within `hydrationTimeout + domSettleMs` ms of page load
- Location: tests\browser\performance.test.js:35:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]: Free delivery above ₹799Easy 7-day returns100% secure payments
  - banner [ref=e3]:
    - generic [ref=e4]:
      - link "SSHOPORAsmart shopping" [ref=e5] [cursor=pointer]:
        - /url: ./index.html
        - text: S
        - generic [ref=e6]: SHOPORAsmart shopping
      - generic "Checkout progress" [ref=e7]:
        - text: 1 Cart
        - text: 2 Details
        - text: 3 Confirmation
      - link "Continue shopping →" [ref=e8] [cursor=pointer]:
        - /url: ./category.html
  - main [ref=e9]:
    - generic [ref=e10]:
      - navigation [ref=e11]:
        - link "Home" [ref=e12] [cursor=pointer]:
          - /url: ./index.html
        - text: ›Cart
      - generic [ref=e13]:
        - generic [ref=e14]:
          - text: YOUR BAG
          - heading "Shopping cart" [level=1] [ref=e15]
        - text: 0 items
    - complementary [ref=e16]:
      - heading "Order summary" [level=2] [ref=e17]
      - generic [ref=e18]:
        - generic [ref=e19]: Items (0)
        - strong [ref=e20]: ₹0
      - generic [ref=e21]:
        - text: Delivery
        - strong [ref=e22]: ₹0
      - generic [ref=e23]:
        - text: You save
        - strong [ref=e24]: ₹0
      - generic [ref=e25]:
        - text: Order total
        - strong [ref=e26]: ₹0
      - paragraph [ref=e27]: Inclusive of all taxes
      - link "Proceed to checkout" [ref=e28] [cursor=pointer]:
        - /url: ./checkout.html
      - generic [ref=e29]: 🔒 Secure checkoutUPI · Cards · Net Banking · COD
  - generic [ref=e32]:
    - text: YOU MAY ALSO LIKE
    - heading "Customers also bought" [level=2] [ref=e33]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import fs from 'fs';
  3   | import path from 'path';
  4   | import { fileURLToPath } from 'url';
  5   | 
  6   | const __filename = fileURLToPath(import.meta.url);
  7   | const __dirname = path.dirname(__filename);
  8   | 
  9   | const promoHtml = fs.readFileSync(path.resolve(__dirname, '../fixtures/promo-page.html'), 'utf-8');
  10  | const cartHtml = fs.readFileSync(path.resolve(__dirname, '../fixtures/cart-page.html'), 'utf-8');
  11  | 
  12  | test.describe('Tag Performance', () => {
  13  |   
  14  |   test('CLS score is 0 with the tag', async ({ page }) => {
  15  |     await page.route('**/tag.js', route => route.fulfill({ path: path.resolve(__dirname, '../../../src/tag.js') }));
  16  |     await page.setContent(promoHtml);
  17  |     
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
> 55  |     expect(beaconFired).toBe(true);
      |                         ^ Error: expect(received).toBe(expected) // Object.is equality
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
  118 |     expect(longTasks.length).toBe(0);
  119 |   });
  120 | });
  121 | 
```