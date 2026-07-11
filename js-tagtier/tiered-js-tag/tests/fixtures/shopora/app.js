import { products, categories } from './data/products.js';

const CART_KEY = 'shopora-cart-v2';
const WISHLIST_KEY = 'shopora-wishlist';
const USD_RATE = 1;
const FREE_DELIVERY_MIN = 35;
const DELIVERY_FEE = 5;
const cart = loadCart();
const wishlist = new Set(loadJSON(WISHLIST_KEY, []));
const currentPage = location.pathname.split('/').pop() || 'index.html';

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function loadCart() {
  const saved = loadJSON(CART_KEY, {});
  return Object.fromEntries(Object.entries(saved).filter(([id, quantity]) => products.some((p) => p.id === id) && Number.isFinite(quantity) && quantity > 0));
}
function retailPrice(product) { return product.price * USD_RATE; }
function retailOldPrice(product) { return product.oldPrice * USD_RATE; }
function money(value) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value); }
function discount(product) { return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100); }
function ratingCount(product) { return 120 + [...product.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) * 9; }
function cartCount() { return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0); }
function cartItems() { return Object.entries(cart).map(([id, quantity]) => { const product = products.find((item) => item.id === id); return product ? { ...product, quantity } : null; }).filter(Boolean); }
function cartSubtotal() { return cartItems().reduce((sum, item) => sum + retailPrice(item) * item.quantity, 0); }
function cartSavings() { return cartItems().reduce((sum, item) => sum + (retailOldPrice(item) - retailPrice(item)) * item.quantity, 0); }
function deliveryFor(subtotal) { return subtotal > 0 && subtotal < FREE_DELIVERY_MIN ? DELIVERY_FEE : 0; }

function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateHeaderCounts(); }
function saveWishlist() { localStorage.setItem(WISHLIST_KEY, JSON.stringify([...wishlist])); updateHeaderCounts(); }
function addToCart(id, quantity = 1) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  const next = Math.min(product.stock, (cart[id] || 0) + quantity);
  cart[id] = next;
  saveCart();
  refreshCartViews();
  toast(next >= product.stock ? 'Maximum available quantity is now in your cart.' : product.name + ' added to cart.', 'success');
}
function updateQuantity(id, quantity) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  const next = Math.max(0, Math.min(product.stock, quantity));
  if (!next) delete cart[id]; else cart[id] = next;
  saveCart(); refreshCartViews();
}
function removeFromCart(id) { delete cart[id]; saveCart(); refreshCartViews(); toast('Item removed from cart.'); }
function toggleWishlist(id, button) {
  if (wishlist.has(id)) wishlist.delete(id); else wishlist.add(id);
  button?.classList.toggle('active', wishlist.has(id));
  button && (button.textContent = wishlist.has(id) ? '♥' : '♡');
  saveWishlist();
  toast(wishlist.has(id) ? 'Saved to your wishlist.' : 'Removed from your wishlist.');
}
function updateHeaderCounts() {
  document.querySelectorAll('[data-cart-count]').forEach((node) => node.textContent = String(cartCount()));
  document.querySelectorAll('[data-wishlist-count]').forEach((node) => node.textContent = String(wishlist.size));
}
function toast(message, type = '') {
  const region = document.querySelector('#toastRegion');
  if (!region) return;
  const node = document.createElement('div');
  node.className = 'toast ' + type;
  node.textContent = message;
  region.appendChild(node);
  window.setTimeout(() => node.remove(), 3000);
}

const bookPalettes = [['#243b6b', '#d48352'], ['#285943', '#d8b04c'], ['#733b62', '#ef9d70'], ['#24395f', '#8ea7cc'], ['#8a352b', '#e7ba69']];
function applyVisual(node, product) {
  if (!node) return;
  node.classList.remove('sprite-electronics', 'sprite-fashion', 'sprite-home', 'sprite-books', 'custom-product-image');
  node.style.backgroundImage = '';
  node.style.backgroundSize = '';
  node.style.backgroundPosition = '';
  node.setAttribute('role', 'img');
  node.setAttribute('aria-label', product.name + ' product image');

  if (product.image) {
    node.classList.add('custom-product-image');
    node.style.backgroundImage = 'url("' + product.image + '")';
    node.style.backgroundSize = 'contain';
    node.style.backgroundPosition = 'center';
    return;
  }

  node.classList.add('sprite-' + product.category);
  const index = Math.max(0, Number(product.id.split('-')[1]) - 1);
  node.style.setProperty('--sprite-x', (index % 5) * 25 + '%');
  node.style.setProperty('--sprite-y', Math.floor(index / 5) * 50 + '%');
}
function buildProductCard(product, template) {
  const card = template.content.firstElementChild.cloneNode(true);
  applyVisual(card.querySelector('.product-image'), product);
  card.dataset.productId = product.id;
  card.querySelector('.discount-badge').textContent = discount(product) + '% OFF';
  card.querySelector('.product-brand').textContent = product.name.split(' ')[0];
  card.querySelector('h3').textContent = product.name;
  card.querySelector('.stars').textContent = product.rating.toFixed(1) + ' ★';
  card.querySelector('.rating-count').textContent = ratingCount(product).toLocaleString('en-IN');
  card.querySelector('.product-meta').textContent = product.description;
  card.querySelector('.price-stack strong').textContent = money(retailPrice(product));
  card.querySelector('.price-stack del').textContent = money(retailOldPrice(product));
  card.querySelector('.price-stack span').textContent = 'Save ' + money(retailOldPrice(product) - retailPrice(product));
  const navigateToPDP = (e) => {
    e.preventDefault();
    location.href = `./pdp.html?id=${product.id}`;
  };
  const img = card.querySelector('.product-image');
  img.addEventListener('click', navigateToPDP);
  img.style.cursor = 'pointer';
  const title = card.querySelector('h3');
  title.addEventListener('click', navigateToPDP);
  title.style.cursor = 'pointer';

  const wishButton = card.querySelector('.wishlist-button');
  wishButton.classList.toggle('active', wishlist.has(product.id));
  wishButton.textContent = wishlist.has(product.id) ? '♥' : '♡';
  wishButton.addEventListener('click', () => toggleWishlist(product.id, wishButton));
  card.querySelector('.add-to-cart').addEventListener('click', () => addToCart(product.id));
  card.querySelector('.quick-view').addEventListener('click', () => showQuickView(product));
  return card;
}
function showQuickView(product) {
  const modal = document.querySelector('#quickViewModal');
  if (!modal) return;
  modal.innerHTML = `<article class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><button class="modal-close" aria-label="Close quick view">×</button><div class="product-image"></div><div class="modal-copy"><span class="section-kicker">${product.badge}</span><h2 id="modalTitle">${product.name}</h2><div class="rating-line"><span class="stars">${product.rating.toFixed(1)} ★</span><span class="rating-count">${ratingCount(product).toLocaleString('en-IN')} ratings</span></div><p>${product.description}</p><div class="price-stack"><strong>${money(retailPrice(product))}</strong><del>${money(retailOldPrice(product))}</del><span>${discount(product)}% off</span></div><p class="delivery-note">FREE delivery <b>Tomorrow</b> · ${product.stock} in stock</p><h3>Highlights</h3><ul>${product.specs.map((spec) => '<li>' + spec + '</li>').join('')}</ul><button class="button button-primary full-width modal-add">Add to cart</button></div></article>`;
  applyVisual(modal.querySelector('.product-image'), product);
  modal.hidden = false; document.body.classList.add('modal-open');
  const close = () => { modal.hidden = true; document.body.classList.remove('modal-open'); };
  modal.querySelector('.modal-close').addEventListener('click', close);
  modal.querySelector('.modal-add').addEventListener('click', () => { addToCart(product.id); close(); });
  modal.addEventListener('click', (event) => { if (event.target === modal) close(); }, { once: true });
  modal.querySelector('.modal-close').focus();
}
function createDealCard(product) {
  const card = document.createElement('article');
  card.className = 'deal-card';
  card.innerHTML = `<div class="product-image" style="cursor:pointer"><span class="discount-badge">${discount(product)}% OFF</span></div><div class="deal-info"><span class="deal-chip">${product.badge}</span><h3 style="cursor:pointer">${product.name}</h3><div class="deal-price"><strong>${money(retailPrice(product))}</strong><del>${money(retailOldPrice(product))}</del></div><button class="button button-primary">Add to cart</button></div>`;
  applyVisual(card.querySelector('.product-image'), product);
  card.querySelector('button').addEventListener('click', () => addToCart(product.id));
  const navigateToPDP = (e) => { e.preventDefault(); location.href = `./pdp.html?id=${product.id}`; };
  card.querySelector('.product-image').addEventListener('click', navigateToPDP);
  card.querySelector('h3').addEventListener('click', navigateToPDP);
  return card;
}

function renderHome() {
  const template = document.querySelector('#productCardTemplate');
  if (!template) return;
  const heroDeal = products.find((product) => product.deal) || products[0];
  document.querySelector('#heroDealName').textContent = heroDeal.name;
  document.querySelector('#heroDealPrice').textContent = money(retailPrice(heroDeal));
  document.querySelector('#heroDealOld').textContent = money(retailOldPrice(heroDeal));
  document.querySelector('#heroDealAdd').addEventListener('click', () => addToCart(heroDeal.id));
  const categoryGrid = document.querySelector('#categoryGrid');
  categoryGrid.innerHTML = categories.map((category) => `<a class="category-card ${category.key}" href="./category.html?category=${category.key}"><span>15 PRODUCTS</span><strong>${category.label}</strong><p>${category.description}</p></a>`).join('');
  const dealStrip = document.querySelector('#dealStrip');
  products.filter((product) => product.deal).slice(0, 8).forEach((product) => dealStrip.appendChild(createDealCard(product)));
  const featuredGrid = document.querySelector('#featuredGrid');
  [products[1], products[2], products[16], products[17], products[30], products[33], products[45], products[54]].forEach((product) => featuredGrid.appendChild(buildProductCard(product, template)));
  startDealTimer();
}
function startDealTimer() {
  const node = document.querySelector('#dealTimer'); if (!node) return;
  let seconds = 9 * 3600 + 42 * 60 + 18;
  window.setInterval(() => { seconds = Math.max(0, seconds - 1); const h = String(Math.floor(seconds / 3600)).padStart(2, '0'); const m = String(Math.floor(seconds % 3600 / 60)).padStart(2, '0'); const s = String(seconds % 60).padStart(2, '0'); node.textContent = h + ':' + m + ':' + s; }, 1000);
}
function renderCatalog() {
  const template = document.querySelector('#productCardTemplate');
  const grid = document.querySelector('#catalogGrid');
  if (!template || !grid) return;
  const params = new URLSearchParams(location.search);
  let activeCategory = categories.some((c) => c.key === params.get('category')) ? params.get('category') : 'all';
  const dealOnly = params.get('deal') === 'true';
  const search = document.querySelector('#searchInput');
  const sort = document.querySelector('#sortSelect');
  const price = document.querySelector('#priceRange');
  const priceOutput = document.querySelector('#priceOutput');
  const filterList = document.querySelector('#categoryFilters');
  const empty = document.querySelector('#emptyResults');
  search.value = params.get('q') || '';
  filterList.innerHTML = [{ key: 'all', label: 'All departments' }, ...categories].map((category) => `<button data-category="${category.key}" class="${activeCategory === category.key ? 'active' : ''}">${category.label}</button>`).join('');
  function applyFilters() {
    const term = search.value.trim().toLowerCase();
    const minRating = Number(document.querySelector('input[name="rating"]:checked')?.value || 0);
    const maxPrice = Number(price.value);
    let filtered = products.filter((product) => {
      const searchable = [product.name, product.description, product.badge, ...product.specs].join(' ').toLowerCase();

      // Smart search: match whole words or basic plurals, preventing "table" from matching "adjustable" or "tablets"
      const searchMatch = !term || term.split(/\s+/).every(t => {
        const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escaped}(s|es)?\\b`, 'i').test(searchable);
      });

      return (activeCategory === 'all' || product.category === activeCategory) && (!dealOnly || product.deal) && searchMatch && retailPrice(product) <= maxPrice && product.rating >= minRating;
    });

    // Score relevance so exact name matches appear first
    if (term) {
      filtered.forEach(product => {
        product._relevance = 0;
        const nameLower = product.name.toLowerCase();
        term.split(/\s+/).forEach(t => {
          if (nameLower.includes(t)) product._relevance += 10;
          else if (product.description.toLowerCase().includes(t)) product._relevance += 1;
        });
      });
    }

    const sorters = {
      'price-low': (a, b) => retailPrice(a) - retailPrice(b),
      'price-high': (a, b) => retailPrice(b) - retailPrice(a),
      rating: (a, b) => b.rating - a.rating,
      discount: (a, b) => discount(b) - discount(a),
      featured: (a, b) => term ? ((b._relevance || 0) - (a._relevance || 0) || Number(b.deal) - Number(a.deal) || b.rating - a.rating) : (Number(b.deal) - Number(a.deal) || b.rating - a.rating)
    };
    filtered.sort(sorters[sort.value] || sorters.featured);
    priceOutput.textContent = 'Up to ' + money(maxPrice);
    document.querySelector('#resultCount').textContent = filtered.length + ' products';
    const categoryName = activeCategory === 'all' ? 'All products' : categories.find((c) => c.key === activeCategory).label;

    let headingText = dealOnly ? "Today's deals" : categoryName;
    if (term) {
      headingText = `Search results for "${search.value.trim()}"`;
    }
    document.querySelector('#resultsHeading').textContent = headingText;

    const subheadingText = activeCategory === 'all'
      ? 'Quality picks across electronics, fashion, home and books.'
      : `Quality picks across ${categoryName.toLowerCase()}.`;
    document.querySelector('#resultsSubheading').textContent = subheadingText;
    grid.innerHTML = '';
    filtered.forEach((product) => grid.appendChild(buildProductCard(product, template)));
    empty.hidden = filtered.length !== 0;
    grid.hidden = filtered.length === 0;
  }
  filterList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]'); if (!button) return;
    activeCategory = button.dataset.category;
    filterList.querySelectorAll('button').forEach((node) => node.classList.toggle('active', node === button));
    applyFilters();
  });
  [search, sort, price, ...document.querySelectorAll('input[name="rating"]')].forEach((control) => control.addEventListener(control === sort ? 'change' : 'input', applyFilters));
  function clearFilters() { activeCategory = 'all'; search.value = ''; sort.value = 'featured'; price.value = price.max; document.querySelector('input[name="rating"][value="0"]').checked = true; filterList.querySelectorAll('button').forEach((button) => button.classList.toggle('active', button.dataset.category === 'all')); applyFilters(); }
  document.querySelector('#clearFilters').addEventListener('click', clearFilters);
  document.querySelector('#emptyClear').addEventListener('click', clearFilters);
  document.querySelector('#filterToggle').addEventListener('click', () => document.querySelector('#filterPanel').classList.toggle('open'));
  applyFilters();
}
function renderCart() {
  const container = document.querySelector('#cartItems');
  if (!container) return;
  const items = cartItems(), subtotal = cartSubtotal(), delivery = deliveryFor(subtotal), savings = cartSavings();
  document.querySelector('#summaryItems').textContent = String(cartCount());
  document.querySelector('#summarySubtotal').textContent = money(subtotal);
  document.querySelector('#summaryDelivery').textContent = delivery ? money(delivery) : 'FREE';
  document.querySelector('#summarySavings').textContent = money(savings);
  document.querySelector('#summaryTotal').textContent = money(subtotal + delivery);
  document.querySelector('#cartItemLabel').textContent = cartCount() + (cartCount() === 1 ? ' item' : ' items');
  const checkoutButton = document.querySelector('#checkoutButton');
  checkoutButton.classList.toggle('disabled', !items.length);
  checkoutButton.setAttribute('aria-disabled', String(!items.length));
  const progress = document.querySelector('#shippingProgress');
  const remaining = Math.max(0, FREE_DELIVERY_MIN - subtotal);
  progress.innerHTML = subtotal >= FREE_DELIVERY_MIN ? '<p><strong>✓ You unlocked FREE delivery!</strong></p><div class="progress-track"><i style="width:100%"></i></div>' : `<p>Add <strong>${money(remaining)}</strong> more for FREE delivery</p><div class="progress-track"><i style="width:${Math.min(100, subtotal / FREE_DELIVERY_MIN * 100)}%"></i></div>`;
  if (!items.length) { container.innerHTML = '<div class="cart-empty"><span>🛒</span><h2>Your cart is empty</h2><p>Looks like you have not added anything yet.</p><a class="button button-accent" href="./category.html">Start shopping</a></div>'; return; }
  container.innerHTML = items.map((item) => `<article class="cart-item" data-cart-id="${item.id}"><div class="product-image" style="cursor:pointer"></div><div><span class="section-kicker">${item.badge}</span><h3 style="cursor:pointer">${item.name}</h3><p class="cart-item-meta">${item.description}</p><p class="cart-item-meta"><b>In stock</b> · FREE returns</p><div class="cart-item-actions"><div class="quantity-control"><button data-dec aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-inc aria-label="Increase quantity">+</button></div><button class="text-button" data-save>Save for later</button><button class="text-button" data-remove>Remove</button></div></div><div class="cart-item-price"><strong>${money(retailPrice(item) * item.quantity)}</strong><del>${money(retailOldPrice(item) * item.quantity)}</del><small>${discount(item)}% off</small></div></article>`).join('');
  items.forEach((item) => { 
    const row = container.querySelector('[data-cart-id="' + item.id + '"]'); 
    applyVisual(row.querySelector('.product-image'), item); 
    const navPDP = (e) => { e.preventDefault(); location.href = `./pdp.html?id=${item.id}`; };
    row.querySelector('.product-image').addEventListener('click', navPDP);
    row.querySelector('h3').addEventListener('click', navPDP);
    row.querySelector('[data-dec]').addEventListener('click', () => updateQuantity(item.id, item.quantity - 1)); 
    row.querySelector('[data-inc]').addEventListener('click', () => updateQuantity(item.id, item.quantity + 1)); 
    row.querySelector('[data-remove]').addEventListener('click', () => removeFromCart(item.id)); 
    row.querySelector('[data-save]').addEventListener('click', () => { wishlist.add(item.id); saveWishlist(); removeFromCart(item.id); toast('Moved to your wishlist.'); }); 
  });
}
function renderRecommendations() {
  const grid = document.querySelector('#recommendedGrid'), template = document.querySelector('#productCardTemplate'); if (!grid || !template) return;
  products.filter((product) => !cart[product.id]).slice(5, 9).forEach((product) => grid.appendChild(buildProductCard(product, template)));
}
function renderCheckout() {
  const container = document.querySelector('#checkoutItems'), form = document.querySelector('#checkoutForm'); if (!container || !form) return;
  const update = () => { 
    const items = cartItems(), subtotal = cartSubtotal(), delivery = deliveryFor(subtotal); 
    document.querySelector('#checkoutSubtotal').textContent = money(subtotal); 
    document.querySelector('#checkoutDelivery').textContent = delivery ? money(delivery) : 'FREE'; 
    document.querySelector('#checkoutTotal').textContent = money(subtotal + delivery); 
    document.querySelector('#placeOrderButton').disabled = !items.length; 
    container.innerHTML = items.length ? items.map((item) => `<div class="mini-item" data-mini-id="${item.id}"><div class="product-image" style="cursor:pointer"></div><div><p style="cursor:pointer">${item.name}</p><small>Qty ${item.quantity}</small></div><strong>${money(retailPrice(item) * item.quantity)}</strong></div>`).join('') : '<div class="cart-empty"><p>Your cart is empty.</p><a class="button button-primary" href="./category.html">Shop products</a></div>'; 
    items.forEach((item) => {
      const row = container.querySelector('[data-mini-id="' + item.id + '"]');
      applyVisual(row.querySelector('.product-image'), item);
      
      const navPDP = (e) => { e.preventDefault(); location.href = `./pdp.html?id=${item.id}`; };
      row.querySelector('.product-image').addEventListener('click', navPDP);
      row.querySelector('p').addEventListener('click', navPDP);
    }); 
  };
  update();
  form.addEventListener('submit', (event) => { event.preventDefault(); const items = cartItems(); if (!items.length) { toast('Your cart is empty.'); return; } const orderId = 'SP' + Date.now().toString().slice(-8); Object.keys(cart).forEach((key) => delete cart[key]); saveCart(); update(); form.reset(); const message = document.querySelector('#orderMessage'); message.innerHTML = `<div class="success-card"><span>✓</span><h2>Order confirmed!</h2><p>Your demo order <strong>#${orderId}</strong> has been placed successfully.</p><p>No payment was processed.</p><a class="button button-accent full-width" href="./index.html">Continue shopping</a></div>`; message.hidden = false; });
}
function renderPDP() {
  const params = new URLSearchParams(location.search);
  const productId = params.get('id') || 'el-1';
  const product = products.find(p => p.id === productId) || products[0];

  const main = document.querySelector('#mainContent');
  if (!main) return;
  
  // Reset inline styles on main to have full control of the layout
  main.style.cssText = 'display: block; padding: 40px max(20px, calc((100vw - 1400px) / 2)); max-width: none; background: #fff;';

  let specLabels = ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'];
  let variantLabel = 'Style';
  let variantOptions = ['Standard', 'Premium'];
  
  if (product.category === 'electronics') {
    specLabels = ['Brand', 'Operating System', 'RAM Memory', 'CPU Model'];
    variantLabel = 'Configuration';
    variantOptions = ['Base Edition', 'Pro Edition', 'Max Edition'];
  } else if (product.category === 'fashion') {
    specLabels = ['Material', 'Fit Type', 'Care Instructions', 'Pattern'];
    variantLabel = 'Size';
    variantOptions = ['S', 'M', 'L', 'XL'];
  } else if (product.category === 'home') {
    specLabels = ['Material', 'Color', 'Room Type', 'Style'];
    variantLabel = 'Finish';
    variantOptions = ['Default', 'Matte', 'Glossy'];
  } else if (product.category === 'books') {
    specLabels = ['Format', 'Pages', 'Language', 'Publisher'];
    variantLabel = 'Format';
    variantOptions = ['Paperback', 'Hardcover', 'Kindle Edition'];
  }

  const discountPercent = discount(product);
  const retailP = retailPrice(product);
  const oldP = retailOldPrice(product);
  const brandName = product.name.split(' ')[0];

  const html = `
    <style>
      @keyframes pdp-pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(18,128,92, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(18,128,92, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(18,128,92, 0); }
      }
      .pdp-main-image { transition: all 0.2s ease; }
    </style>
    <div style="max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 1.3fr 1fr; gap: 80px; padding-bottom: 60px;">
      
      <!-- Left: Image Gallery (Sticky) -->
      <div style="position: sticky; top: 100px; height: max-content; display: flex; gap: 24px; align-items: flex-start;">
        <!-- Thumbnails (Vertical) -->
        <div style="display: flex; flex-direction: column; gap: 16px; width: 85px;">
          <div class="pdp-thumb" style="width: 100%; aspect-ratio: 1; border: 2px solid var(--blue); border-radius: 12px; background: var(--soft); cursor: pointer; transition: 0.2s;"></div>
          <div class="pdp-thumb" style="width: 100%; aspect-ratio: 1; border: 2px solid transparent; border-radius: 12px; background: var(--soft); cursor: pointer; opacity: 0.5; transition: 0.2s;"></div>
          <div class="pdp-thumb" style="width: 100%; aspect-ratio: 1; border: 2px solid transparent; border-radius: 12px; background: var(--soft); cursor: pointer; opacity: 0.5; transition: 0.2s;"></div>
          <div class="pdp-thumb" style="width: 100%; aspect-ratio: 1; border: 2px solid transparent; border-radius: 12px; background: var(--soft); cursor: pointer; opacity: 0.5; transition: 0.2s;"></div>
        </div>
        <!-- Main Image -->
        <div class="pdp-main-image" style="flex: 1; aspect-ratio: 1; background-color: var(--soft); border-radius: 24px; position: relative; box-shadow: 0 20px 40px rgba(16,36,62,0.04); overflow: hidden; display: flex; align-items: center; justify-content: center;">
          <div class="product-image custom-product-image" style="width: 100%; aspect-ratio: 4/5; transform: scale(1.35); transform-origin: center;"></div>
        </div>
      </div>

      <!-- Right: Product Info -->
      <div style="padding-top: 0;">
        <!-- Breadcrumb -->
        <div style="font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; margin-bottom: 8px;">
          <a href="./index.html" style="color: var(--muted); transition: 0.2s;" onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--muted)'">Home</a> / 
          <a href="./category.html" style="color: var(--muted); transition: 0.2s;" onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--muted)'">${product.category}</a> / 
          <span style="color: var(--navy);">${brandName}</span>
        </div>

        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 6px; background: #fff0f0; border: 1px solid #ffdcdc; color: #d02e2e; padding: 2px 8px; border-radius: 50px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
            <span style="font-size: 0.9rem;">&bull;</span> High Demand
          </div>
          <div style="color: var(--blue); font-weight: 800; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em;">${brandName} Official</div>
        </div>
        
        <h1 style="font-size: clamp(1.4rem, 2.5vw, 2rem); font-weight: 800; color: var(--navy); line-height: 1.1; letter-spacing: -0.02em; margin: 0 0 6px;">${product.name}</h1>
        
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 4px; background: var(--navy); color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> ${product.rating.toFixed(1)}
          </div>
          <span style="color: var(--muted); font-size: 0.8rem; font-weight: 500; cursor: pointer; border-bottom: 1px dashed var(--muted); padding-bottom: 2px;">${ratingCount(product).toLocaleString()} Reviews</span>
        </div>

        <p style="font-size: 0.9rem; color: var(--muted); line-height: 1.4; margin-bottom: 12px; max-width: 95%;">
          ${product.description} Built for premium quality and designed to elevate your everyday experience.
        </p>

        <!-- Price -->
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid var(--line);">
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--navy); line-height: 1; letter-spacing: -0.02em;">
            ${money(retailP)}
          </div>
          ${product.deal ? `<div style="background: #fee4e2; color: #b42318; padding: 4px 8px; border-radius: 50px; font-weight: 800; font-size: 0.7rem; letter-spacing: 0.05em;">SAVE ${discountPercent}%</div>` : ''}
          <div style="color: var(--muted); text-decoration: line-through; font-size: 1rem; font-weight: 500;">
            ${money(oldP)}
          </div>
        </div>

        <!-- Variants -->
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--navy); text-transform: uppercase; letter-spacing: 0.08em;">
              ${variantLabel}: <span id="variant-label" style="color: var(--muted); font-weight: 500;">${variantOptions[0]}</span>
            </div>
            ${product.category === 'fashion' ? '<a href="#" style="color: var(--blue); font-size: 0.75rem; font-weight: 600; text-decoration: underline;">Size Guide</a>' : ''}
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${variantOptions.map((opt, i) => `
              <button class="pdp-variant-btn" data-variant="${opt}" data-active="${i === 0 ? 'true' : 'false'}" style="padding: 6px 14px; border: 2px solid ${i===0 ? 'var(--navy)' : 'var(--line)'}; background: transparent; border-radius: 50px; cursor: pointer; color: ${i===0 ? 'var(--navy)' : 'var(--muted)'}; font-size: 0.75rem; font-weight: 700; transition: all 0.2s;" onmouseover="if(this.dataset.active !== 'true') { this.style.borderColor='var(--navy)'; this.style.color='var(--navy)'; }" onmouseout="if(this.dataset.active !== 'true') { this.style.borderColor='var(--line)'; this.style.color='var(--muted)'; }">
                ${opt}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Action Area -->
        <div style="background: var(--soft); padding: 15px 20px; border-radius: 16px; margin-bottom: 15px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
            <div style="display: flex; align-items: center; gap: 8px; color: var(--green); font-weight: 700; font-size: 0.95rem;">
              <div style="width: 10px; height: 10px; background: var(--green); border-radius: 50%; animation: pdp-pulse 2s infinite;"></div>
              In Stock & Ready to Ship
            </div>
            <div style="font-size: 0.8rem; color: var(--muted); font-weight: 500;">Order within 5 hrs</div>
          </div>
          
          <div style="display: flex; gap: 12px; align-items: stretch; height: 50px;">
            
            <!-- Quantity Selector -->
            <div style="display: flex; align-items: center; border: 2px solid var(--line); border-radius: 16px; background: #fff; overflow: hidden; width: 140px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
              <button id="qty-minus" style="width: 45px; height: 100%; background: transparent; border: none; font-size: 1.5rem; color: var(--navy); cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='var(--soft)'" onmouseout="this.style.background='transparent'">−</button>
              <div id="qty-value" style="flex: 1; text-align: center; font-size: 1.2rem; font-weight: 800; color: var(--navy);">1</div>
              <button id="qty-plus" style="width: 45px; height: 100%; background: transparent; border: none; font-size: 1.5rem; color: var(--navy); cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='var(--soft)'" onmouseout="this.style.background='transparent'">+</button>
            </div>
            
            <button id="pdpAddToCart" style="flex: 1; font-size: 1.15rem; border-radius: 16px; background: var(--blue); border: none; color: #fff; font-weight: 800; cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 8px 20px rgba(20,99,255,0.25);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 25px rgba(20,99,255,0.35)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 20px rgba(20,99,255,0.25)'">
              Add to Cart — <span id="add-to-cart-price">${money(retailP)}</span>
            </button>
            <button id="pdpWishlistBtn" data-active="false" style="width: 70px; border-radius: 16px; background: #fff; border: 2px solid var(--line); color: var(--navy); font-size: 1.6rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;" onmouseover="if(this.dataset.active !== 'true') { this.style.borderColor='var(--blue)'; this.style.color='var(--blue)'; }" onmouseout="if(this.dataset.active !== 'true') { this.style.borderColor='var(--line)'; this.style.color='var(--navy)'; }">
              ♡
            </button>
          </div>
          
          <div style="display: flex; justify-content: space-around; font-size: 0.85rem; color: var(--muted); font-weight: 600; margin-top: 25px; border-top: 1px solid var(--line); padding-top: 20px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg> Free Shipping
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg> 30-Day Returns
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Secure Checkout
            </div>
          </div>
        </div>

        <!-- Specs Accordion -->
        <div style="border-top: 1px solid var(--line);">
          <div class="pdp-accordion" style="padding: 30px 0; border-bottom: 1px solid var(--line);">
            <div class="pdp-accordion-header" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
              <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--navy); margin: 0;">Product Specifications</h3>
              <span class="pdp-accordion-icon" style="font-size: 1.5rem; color: var(--muted); font-weight: 300;">−</span>
            </div>
            <div class="pdp-accordion-content" style="margin-top: 25px; display: block;">
              <ul style="list-style: none; padding: 0; margin: 0; display: grid; gap: 16px;">
                ${product.specs.map((spec, i) => `
                  <li style="display: flex; font-size: 1.05rem; padding-bottom: 16px; border-bottom: 1px dashed var(--line);">
                    <span style="width: 40%; color: var(--muted); font-weight: 600;">${specLabels[i] || 'Detail'}</span>
                    <span style="width: 60%; color: var(--navy); font-weight: 600;">${spec}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
          
          <!-- Delivery Info Accordion -->
          <div class="pdp-accordion" style="padding: 30px 0; border-bottom: 1px solid var(--line);">
            <div class="pdp-accordion-header" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
              <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--navy); margin: 0;">Delivery & Returns</h3>
              <span class="pdp-accordion-icon" style="font-size: 1.5rem; color: var(--muted); font-weight: 300;">+</span>
            </div>
            <div class="pdp-accordion-content" style="margin-top: 25px; display: none;">
              <div style="font-size: 1.05rem; color: var(--muted); line-height: 1.6; display: flex; flex-direction: column; gap: 15px;">
                <div>
                  <strong style="color: var(--navy);">Standard Delivery:</strong> 3-5 business days. Free for orders over $50.
                </div>
                <div>
                  <strong style="color: var(--navy);">Express Delivery:</strong> 1-2 business days. Available at checkout for $12.99.
                </div>
                <div>
                  <strong style="color: var(--navy);">Returns Policy:</strong> We offer a 30-day return policy for unused items in original packaging. Refunds are processed within 5-7 business days after inspection.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  main.innerHTML = html;

  applyVisual(main.querySelector('.product-image'), product);
  main.querySelector('#pdpAddToCart').addEventListener('click', () => addToCart(product.id));

  // Wishlist Logic
  const wishlistBtn = main.querySelector('#pdpWishlistBtn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      const isActive = wishlistBtn.dataset.active === 'true';
      if (isActive) {
        wishlistBtn.dataset.active = 'false';
        wishlistBtn.style.color = 'var(--navy)';
        wishlistBtn.style.borderColor = 'var(--line)';
        wishlistBtn.innerHTML = '♡';
      } else {
        wishlistBtn.dataset.active = 'true';
        wishlistBtn.style.color = '#e02424';
        wishlistBtn.style.borderColor = '#e02424';
        wishlistBtn.innerHTML = '♥';
      }
    });
  }

  // Variant Logic
  const variantButtonsElements = main.querySelectorAll('.pdp-variant-btn');
  const variantLabelEl = main.querySelector('#variant-label');
  variantButtonsElements.forEach(btn => {
    btn.addEventListener('click', () => {
      variantButtonsElements.forEach(b => {
        b.style.borderColor = 'var(--line)';
        b.style.color = 'var(--muted)';
        b.dataset.active = "false";
      });
      btn.style.borderColor = 'var(--navy)';
      btn.style.color = 'var(--navy)';
      btn.dataset.active = "true";
      if (variantLabelEl) variantLabelEl.textContent = btn.dataset.variant;
    });
  });

  // Accordion Logic
  const accordions = main.querySelectorAll('.pdp-accordion');
  accordions.forEach(acc => {
    const header = acc.querySelector('.pdp-accordion-header');
    const content = acc.querySelector('.pdp-accordion-content');
    const icon = acc.querySelector('.pdp-accordion-icon');
    if (header && content && icon) {
      header.addEventListener('click', () => {
        const isOpen = content.style.display === 'block';
        if (isOpen) {
          content.style.display = 'none';
          icon.textContent = '+';
        } else {
          content.style.display = 'block';
          icon.textContent = '−';
        }
      });
    }
  });

  // Quantity Selector Logic
  const qtyMinus = main.querySelector('#qty-minus');
  const qtyPlus = main.querySelector('#qty-plus');
  const qtyValue = main.querySelector('#qty-value');
  const addToCartPrice = main.querySelector('#add-to-cart-price');
  let currentQty = 1;

  if (qtyMinus && qtyPlus && qtyValue && addToCartPrice) {
    qtyMinus.addEventListener('click', () => {
      if (currentQty > 1) {
        currentQty--;
        qtyValue.textContent = currentQty;
        addToCartPrice.textContent = money(retailP * currentQty);
      }
    });
    qtyPlus.addEventListener('click', () => {
      if (currentQty < 10) {
        currentQty++;
        qtyValue.textContent = currentQty;
        addToCartPrice.textContent = money(retailP * currentQty);
      }
    });
  }

  // Interactive Thumbnail Gallery
  const thumbnails = main.querySelectorAll('.pdp-thumb');
  const mainImage = main.querySelector('.pdp-main-image');
  if (thumbnails.length > 0 && mainImage) {
    thumbnails.forEach(thumb => {
      thumb.addEventListener('mouseenter', () => { if (thumb.style.borderColor !== 'var(--blue)') thumb.style.opacity = '1'; });
      thumb.addEventListener('mouseleave', () => { if (thumb.style.borderColor !== 'var(--blue)') thumb.style.opacity = '0.5'; });
      thumb.addEventListener('click', () => {
        thumbnails.forEach(t => { t.style.borderColor = 'transparent'; t.style.opacity = '0.5'; });
        thumb.style.borderColor = 'var(--blue)';
        thumb.style.opacity = '1';
        
        // Quick visual pop to simulate image changing
        mainImage.style.opacity = '0.7';
        mainImage.style.transform = 'scale(0.98)';
        setTimeout(() => {
          mainImage.style.opacity = '1';
          mainImage.style.transform = 'scale(1)';
        }, 150);
      });
    });
  }
}
function initSearch() {
  const form = document.querySelector('#searchForm'), input = document.querySelector('#headerSearch'), category = document.querySelector('#headerCategory'); if (!form || !input) return;
  const params = new URLSearchParams(location.search);
  if (input && params.has('q')) input.value = params.get('q');
  if (category && params.has('category')) {
    const val = params.get('category');
    if (Array.from(category.options).some(o => o.value === val)) category.value = val;
  }
  form.addEventListener('submit', (event) => { event.preventDefault(); const target = new URL('./category.html', location.href); if (input.value.trim()) target.searchParams.set('q', input.value.trim()); if (category?.value && category.value !== 'all') target.searchParams.set('category', category.value); location.href = target.toString(); });
}
function initGlobalInteractions() {
  document.querySelectorAll('[data-toast]').forEach((node) => node.addEventListener('click', (event) => { event.preventDefault(); toast(node.dataset.toast); }));
  const newsletter = document.querySelector('#newsletterForm'); newsletter?.addEventListener('submit', (event) => { event.preventDefault(); toast('You are on the list. Watch your inbox for deals!', 'success'); newsletter.reset(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { const modal = document.querySelector('#quickViewModal'); if (modal && !modal.hidden) { modal.hidden = true; document.body.classList.remove('modal-open'); } } });
}
function refreshCartViews() { if (currentPage === 'cart.html') renderCart(); if (currentPage === 'checkout.html') { location.reload(); } }
updateHeaderCounts(); initSearch(); initGlobalInteractions();
if (currentPage === 'index.html' || currentPage === '') renderHome();
if (currentPage === 'category.html') renderCatalog();
if (currentPage === 'cart.html') { renderCart(); renderRecommendations(); }
if (currentPage === 'checkout.html') renderCheckout();
if (currentPage === 'pdp.html') renderPDP();
window.addEventListener('storage', () => { Object.keys(cart).forEach((key) => delete cart[key]); Object.assign(cart, loadCart()); wishlist.clear(); loadJSON(WISHLIST_KEY, []).forEach((id) => wishlist.add(id)); updateHeaderCounts(); if (currentPage === 'cart.html') renderCart(); });
