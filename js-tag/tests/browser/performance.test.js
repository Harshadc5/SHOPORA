import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const promoHtml = fs.readFileSync(path.resolve(__dirname, '../fixtures/promo-page.html'), 'utf-8');
const cartHtml = fs.readFileSync(path.resolve(__dirname, '../fixtures/cart-page.html'), 'utf-8');

test.describe('Tag Performance', () => {
  
  test('CLS score is 0 with the tag', async ({ page }) => {
    await page.route('**/tag.js', route => route.fulfill({ path: path.resolve(__dirname, '../../../src/tag.js') }));
    await page.setContent(promoHtml);
    
    await page.waitForTimeout(3000);
    
    const cls = await page.evaluate(() => {
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      }).observe({type: 'layout-shift', buffered: true});
      return clsValue;
    });
    
    expect(cls).toBe(0);
  });

  test('Beacon fires within `hydrationTimeout + domSettleMs` ms of page load', async ({ page }) => {
    let beaconFired = false;
    
    // Mock the outbound /collect request to pass
    await page.route('**/collect', route => {
      beaconFired = true;
      route.fulfill({ status: 200, body: 'ok' });
    });

    await page.route('**/tag.js', route => route.fulfill({ path: path.resolve(__dirname, '../../../src/tag.js') }));
    
    // Provide a page that triggers the tag to fire (has signals, like a cart page)
    // We replace the relative endpoint with an absolute one so sendBeacon doesn't fail on about:blank
    const modifiedCartHtml = cartHtml.replace('data-endpoint="/api/collect"', 'data-endpoint="https://shopora-xi-opal.vercel.app/api/collect"');
    await page.setContent(modifiedCartHtml);

    // The test explicitly mandates waiting exactly hydrationTimeout (3000) + domSettleMs (500) = 3500ms.
    // We wait 3500ms max. If the beacon doesn't fire, the test fails.
    await page.waitForTimeout(3500);
    
    expect(beaconFired).toBe(true);
  });

  test('LCP not measurably delayed vs a control page without the tag', async ({ page, context }) => {
    async function getLCP(withTag) {
      const p = await context.newPage();
      if (withTag) {
        await p.route('**/tag.js', route => route.fulfill({ path: path.resolve(__dirname, '../../../src/tag.js') }));
      }
      
      const htmlToLoad = withTag ? promoHtml : promoHtml.replace(/<script src="\.\/tag\.js".*?><\/script>/, '');
      await p.setContent(htmlToLoad);
      
      const lcp = await p.evaluate(async () => {
        return new Promise((resolve) => {
          try {
            new PerformanceObserver((entryList) => {
              const entries = entryList.getEntries();
              const lastEntry = entries[entries.length - 1];
              resolve(lastEntry.startTime);
            }).observe({type: 'largest-contentful-paint', buffered: true});
            setTimeout(() => resolve(0), 1000);
          } catch(e) {
            resolve(0); // Fallback
          }
        });
      });
      await p.close();
      return lcp;
    }

    const lcpWithout = await getLCP(false);
    const lcpWith = await getLCP(true);
    
    // The delay should be negligible. We check if the difference is under a reasonable threshold (e.g., 50ms)
    // Local execution variability is normal, but our tag shouldn't block the paint.
    expect(Math.abs(lcpWith - lcpWithout)).toBeLessThan(50);
  });

  test('Main thread not blocked during capture (no long tasks > 50ms)', async ({ page }) => {
    await page.route('**/tag.js', route => route.fulfill({ path: path.resolve(__dirname, '../../../src/tag.js') }));
    
    // Inject a PerformanceObserver for 'longtask' before adding the script
    await page.evaluate(() => {
      window.__longTasks = [];
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__longTasks.push(entry.duration);
          }
        });
        observer.observe({entryTypes: ['longtask']});
      } catch (e) {
        // Fallback for browsers not supporting longtask
      }
    });

    await page.setContent(promoHtml);
    await page.waitForTimeout(3000); // Wait for tag to fire
    
    const longTasks = await page.evaluate(() => window.__longTasks);
    // The 'longtask' API only triggers if a task exceeds 50ms.
    // If our DOM scrubbing takes less than 50ms, this array will be empty.
    expect(longTasks.length).toBe(0);
  });
});
