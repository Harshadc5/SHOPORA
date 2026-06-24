/**
 * AIORA Local Beacon Receiver
 * Receives sendBeacon POST requests from the JS tag and prints the payload.
 * Run: node receiver.js
 * Then set  data-endpoint="http://localhost:4000"on your script tags.
 */

const http = require('http');

const PORT = 4000;

const server = http.createServer((req, res) => {
  // Allow CORS from any localhost origin (Live Server, etc.)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);

        console.log('\n' + '═'.repeat(60));
        console.log(`📡 BEACON RECEIVED  [${new Date().toLocaleTimeString()}]`);
        console.log('═'.repeat(60));
        console.log(`📄 Page      : ${payload.page?.page_type?.toUpperCase()} — ${payload.page?.page_url}`);
        console.log(`🆔 Client    : ${payload.client_id}`);
        console.log(`🔑 Beacon ID : ${payload.beacon_id}`);
        console.log(`⏱  Timestamp : ${payload.timestamp}`);

        // Promo banners
        const banners = payload.signals?.promo_banners || [];
        console.log(`\n🏷  Promo Banners (${banners.length}):`);
        banners.forEach(b => console.log(`   [${b.surface}] "${b.text_scrubbed}" → ${b.claim_type}`));

        // Fulfillment offers
        const offers = payload.signals?.fulfillment_offers || [];
        console.log(`\n🚚 Fulfillment Offers (${offers.length}):`);
        offers.forEach(o => console.log(`   [${o.trigger_type}] "${o.text_scrubbed}" threshold: ${o.threshold_value_bucket}`));

        // Cart state
        const cart = payload.signals?.cart_state;
        if (cart) {
          console.log(`\n🛒 Cart State:`);
          console.log(`   Items: ${cart.item_count}  |  Subtotal: ${cart.subtotal}`);
          console.log(`   Promo field: ${cart.promo_field_present}  |  Shipping bar: ${cart.shipping_bar_shown}`);
        }

        // Product tiles
        const tiles = payload.signals?.tiles || [];
        console.log(`\n📦 Product Tiles Captured (${tiles.length}):`);
        tiles.slice(0, 10).forEach(t => {
          const markdown = t.has_markdown ? ` [MARKDOWN: ${t.old_price} → ${t.price}]` : '';
          console.log(`   #${t.position + 1} ${t.name}  ${t.price}${markdown}  badge: ${t.badge || '—'}  stock: ${t.in_stock ? '✓' : '✗'}`);
        });
        if (tiles.length > 10) console.log(`   ... and ${tiles.length - 10} more`);

        // DOM size
        const domSize = payload.dom ? Math.round(payload.dom.length / 1024) : 0;
        console.log(`\n🧩 DOM size  : ${domSize} KB (scrubbed)`);
        console.log('═'.repeat(60));

      } catch (e) {
        console.log('\n⚠️  Could not parse payload:', e.message);
        console.log('Raw body:', body.slice(0, 500));
      }

      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'accepted' }));
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   AIORA Local Beacon Receiver                ║');
  console.log(`║   Listening on http://localhost:${PORT}         ║`);
  console.log('║                                              ║');
  console.log('║   Set on your script tags:                   ║');
  console.log(`║   data-endpoint="http://localhost:${PORT}"      ║`);
  console.log('╚══════════════════════════════════════════════╝');
});
