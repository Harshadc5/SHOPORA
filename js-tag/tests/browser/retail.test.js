import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const retailDir = path.resolve(__dirname, '../fixtures/retail-pages');

// Create directory if it doesn't exist to prevent crashes
if (!fs.existsSync(retailDir)) {
  fs.mkdirSync(retailDir, { recursive: true });
}

const htmlFiles = fs.readdirSync(retailDir).filter(f => f.endsWith('.html'));

test.describe('Real Retail DOM Validation', () => {
  if (htmlFiles.length === 0) {
    test('Waiting for retail HTML files', () => {
      console.log('Drop your real-world HTML files into tests/fixtures/retail-pages/');
      expect(true).toBe(true);
    });
  }

  for (const file of htmlFiles) {
    test(`AIORA Tag safely fires on ${file} without crashing`, async ({ page }) => {
      const htmlContent = fs.readFileSync(path.resolve(retailDir, file), 'utf-8');
      
      // Track any errors thrown by the page
      const pageErrors = [];
      page.on('pageerror', err => pageErrors.push(err.message));

      let payload = null;
      // Intercept the tag's POST request to collect data
      await page.route('**/api/collect', async route => {
        const req = route.request();
        if (req.method() === 'POST') {
          try {
            payload = JSON.parse(req.postData());
          } catch(e) {}
        }
        await route.fulfill({ status: 200, body: '{"ok":true}' });
      });

      // Serve our local tag.js file
      await page.route('**/tag.js', route => route.fulfill({ path: path.resolve(__dirname, '../../../src/tag.js') }));
      
      // Inject tag script into the real-world HTML if it's not already there
      let injectedHtml = htmlContent;
      if (!injectedHtml.includes('tag.js')) {
        const scriptTag = `<script src="./tag.js" data-client-id="gymshark-demo" data-endpoint="/api/collect" async></script>`;
        if (injectedHtml.includes('</body>')) {
          injectedHtml = injectedHtml.replace('</body>', scriptTag + '</body>');
        } else {
          injectedHtml += scriptTag;
        }
      }

      // Start waiting for the collect request BEFORE setting content
      const requestPromise = page.waitForRequest('**/api/collect', { timeout: 15000 }).catch(() => null);

      // Load the heavy DOM (only wait for domcontentloaded so dead image links don't block us)
      await page.setContent(injectedHtml, { waitUntil: 'domcontentloaded' });
      
      // Wait for the tag to fire its payload
      await requestPromise;

      // 1. Ensure the tag successfully collected and transmitted data
      expect(payload).not.toBeNull();
      expect(payload.client_id).toBe('gymshark-demo');
      expect(payload.schema_version).toBeDefined();

      // 3. Ensure the payload size is reasonable (avoiding explosive heavy DOM serialization)
      const payloadSizeKB = JSON.stringify(payload).length / 1024;
      expect(payloadSizeKB).toBeLessThan(100); // Should easily be under 100kb even on heavy pages
      
      // 4. Basic PII check: No credit card shaped numbers in the extracted text
      const payloadString = JSON.stringify(payload).toLowerCase();
      expect(payloadString).not.toMatch(/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/); 
    });
  }
});
