export default function handler(req, res) {
  // Allow CORS from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'POST') {
    try {
      // Depending on how the tag sends data (JSON vs text/plain),
      // req.body might already be parsed, or it might be a string.
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

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

      return res.status(202).json({ status: 'accepted' });
    } catch (e) {
      console.error('\n⚠️  Could not parse payload:', e.message);
      return res.status(400).json({ error: 'Invalid payload' });
    }
  }

  return res.status(404).end();
}
