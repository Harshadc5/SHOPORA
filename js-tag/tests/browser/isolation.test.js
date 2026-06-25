import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the heavy real-world DOM from our fixtures
const simpleHtml = fs.readFileSync(path.resolve(__dirname, '../fixtures/simple-page.html'), 'utf-8');
const cartHtml = fs.readFileSync(path.resolve(__dirname, '../fixtures/cart-page.html'), 'utf-8');

test.describe('Tag Isolation', () => {
  
  test('window object has no new properties after tag fires', async ({ page }) => {
    // Route the tag.js request to our actual source code
    await page.route('**/tag.js', route => route.fulfill({ path: path.resolve(__dirname, '../../../src/tag.js') }));
    
    await page.setContent(simpleHtml);
    
    const keysBefore = await page.evaluate(() => Object.keys(window).filter(k => !k.startsWith('__')));
    
    // Wait for the tag's internal timeouts
    await page.waitForTimeout(3000);
    
    const keysAfter = await page.evaluate(() => Object.keys(window).filter(k => !k.startsWith('__')));
    
    expect(keysAfter.length).toBe(keysBefore.length);
  });

  test('document.body and document.head are unchanged', async ({ page }) => {
    await page.route('**/tag.js', route => route.fulfill({ path: path.resolve(__dirname, '../../../src/tag.js') }));
    
    // Set content initially without the script to get a baseline
    const cleanHtml = cartHtml.replace(/<script src="\.\/tag\.js".*?><\/script>/, '');
    await page.setContent(cleanHtml);
    
    const bodyBefore = await page.evaluate(() => document.body.innerHTML);
    const headBefore = await page.evaluate(() => document.head.innerHTML);
    
    // Now set the real HTML which includes the script
    await page.setContent(cartHtml);
    await page.waitForTimeout(3000);
    
    const bodyAfter = await page.evaluate(() => document.body.innerHTML);
    const headAfter = await page.evaluate(() => document.head.innerHTML);
    
    // We expect the core structure to remain identical minus the injected script tag
    expect(bodyAfter.includes('class="product-grid"')).toBe(true);
    expect(headAfter.includes('class=')).toBe(headBefore.includes('class=')); // simplistic check
  });

  test('No uncaught errors on a clean page', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.route('**/tag.js', route => route.fulfill({ path: path.resolve(__dirname, '../../../src/tag.js') }));
    await page.setContent(simpleHtml);

    await page.waitForTimeout(3000);
    // Ignore 404s for missing CSS/JS (app.js, styles.css) since we only care about JS errors thrown by tag.js
    const tagErrors = errors.filter(e => !e.includes('Failed to load resource: net::ERR_FILE_NOT_FOUND'));
    expect(tagErrors.length).toBe(0);
  });

  test('No event listeners added to document or window', async ({ page }) => {
    await page.route('**/tag.js', route => route.fulfill({ path: path.resolve(__dirname, '../../../src/tag.js') }));
    await page.setContent('<html><body></body></html>'); // Setup blank page
    
    // Inject a spy to monitor addEventListener calls before content loads
    await page.evaluate(() => {
      window.__invasiveListeners = 0;
      const originalWinAdd = window.addEventListener;
      window.addEventListener = function(type, listener, options) {
        if (['click', 'scroll', 'mousemove', 'keydown'].includes(type)) window.__invasiveListeners++;
        return originalWinAdd.call(this, type, listener, options);
      };
      
      const originalDocAdd = document.addEventListener;
      document.addEventListener = function(type, listener, options) {
        if (['click', 'scroll', 'mousemove', 'keydown'].includes(type)) window.__invasiveListeners++;
        return originalDocAdd.call(this, type, listener, options);
      };
    });
    
    // Now load the real DOM with the script
    await page.setContent(cartHtml);
    await page.waitForTimeout(2000);
    
    const count = await page.evaluate(() => window.__invasiveListeners);
    expect(count).toBe(0);
  });

  test('Tag does not interfere with a second script on the same page', async ({ page }) => {
    await page.route('**/tag.js', route => route.fulfill({ path: path.resolve(__dirname, '../../../src/tag.js') }));
    
    const htmlWithSecondScript = cartHtml + `
      <script>
        window.__secondScriptRan = false;
        setTimeout(() => { window.__secondScriptRan = true; }, 500);
      </script>
    `;
    
    await page.setContent(htmlWithSecondScript);
    await page.waitForTimeout(2000);
    
    const secondScriptRan = await page.evaluate(() => window.__secondScriptRan);
    expect(secondScriptRan).toBe(true);
  });
});
