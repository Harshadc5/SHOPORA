import { products, categories } from './data/products.js';

const CART_KEY = 'shopora-cart-v2';
const WISHLIST_KEY = 'shopora-wishlist';
const INR_RATE = 83;
const FREE_DELIVERY_MIN = 799;
const DELIVERY_FEE = 99;
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
function retailPrice(product) { return Math.round(product.price * INR_RATE); }
function retailOldPrice(product) { return Math.round(product.oldPrice * INR_RATE); }
function money(value) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value); }
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

const bookPalettes = [['#243b6b','#d48352'],['#285943','#d8b04c'],['#733b62','#ef9d70'],['#24395f','#8ea7cc'],['#8a352b','#e7ba69']];
function applyVisual(node, product) {
  if (!node) return;
  node.classList.remove('sprite-electronics','sprite-fashion','sprite-home','sprite-books','custom-product-image');
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
  if (product.category === 'books') {
    const palette = bookPalettes[index % bookPalettes.length];
    node.style.setProperty('--book-a', palette[0]);
    node.style.setProperty('--book-b', palette[1]);
  }
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
  card.innerHTML = `<div class="product-image"><span class="discount-badge">${discount(product)}% OFF</span></div><div class="deal-info"><span class="deal-chip">${product.badge}</span><h3>${product.name}</h3><div class="deal-price"><strong>${money(retailPrice(product))}</strong><del>${money(retailOldPrice(product))}</del></div><button class="button button-primary">Add to cart</button></div>`;
  applyVisual(card.querySelector('.product-image'), product);
  card.querySelector('button').addEventListener('click', () => addToCart(product.id));
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
  [products[1],products[2],products[16],products[17],products[30],products[33],products[45],products[54]].forEach((product) => featuredGrid.appendChild(buildProductCard(product, template)));
  startDealTimer();
}
function startDealTimer() {
  const node = document.querySelector('#dealTimer'); if (!node) return;
  let seconds = 9 * 3600 + 42 * 60 + 18;
  window.setInterval(() => { seconds = Math.max(0, seconds - 1); const h = String(Math.floor(seconds / 3600)).padStart(2,'0'); const m = String(Math.floor(seconds % 3600 / 60)).padStart(2,'0'); const s = String(seconds % 60).padStart(2,'0'); node.textContent = h + ':' + m + ':' + s; }, 1000);
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
  filterList.innerHTML = [{key:'all',label:'All departments'},...categories].map((category) => `<button data-category="${category.key}" class="${activeCategory === category.key ? 'active' : ''}">${category.label}</button>`).join('');
  function applyFilters() {
    const term = search.value.trim().toLowerCase();
    const minRating = Number(document.querySelector('input[name="rating"]:checked')?.value || 0);
    const maxPrice = Number(price.value);
    let filtered = products.filter((product) => {
      const searchable = [product.name,product.description,product.badge,...product.specs].join(' ').toLowerCase();
      return (activeCategory === 'all' || product.category === activeCategory) && (!dealOnly || product.deal) && (!term || searchable.includes(term)) && retailPrice(product) <= maxPrice && product.rating >= minRating;
    });
    const sorters = { 'price-low':(a,b)=>retailPrice(a)-retailPrice(b),'price-high':(a,b)=>retailPrice(b)-retailPrice(a),rating:(a,b)=>b.rating-a.rating,discount:(a,b)=>discount(b)-discount(a),featured:(a,b)=>Number(b.deal)-Number(a.deal)||b.rating-a.rating };
    filtered.sort(sorters[sort.value] || sorters.featured);
    priceOutput.textContent = 'Up to ' + money(maxPrice);
    document.querySelector('#resultCount').textContent = filtered.length + ' products';
    const categoryName = activeCategory === 'all' ? 'All products' : categories.find((c) => c.key === activeCategory).label;
    document.querySelector('#resultsHeading').textContent = dealOnly ? "Today's deals" : categoryName;
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
  [search,sort,price,...document.querySelectorAll('input[name="rating"]')].forEach((control) => control.addEventListener(control === sort ? 'change' : 'input', applyFilters));
  function clearFilters() { activeCategory='all'; search.value=''; sort.value='featured'; price.value=price.max; document.querySelector('input[name="rating"][value="0"]').checked=true; filterList.querySelectorAll('button').forEach((button) => button.classList.toggle('active',button.dataset.category==='all')); applyFilters(); }
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
  progress.innerHTML = subtotal >= FREE_DELIVERY_MIN ? '<p><strong>✓ You unlocked FREE delivery!</strong></p><div class="progress-track"><i style="width:100%"></i></div>' : `<p>Add <strong>${money(remaining)}</strong> more for FREE delivery</p><div class="progress-track"><i style="width:${Math.min(100,subtotal/FREE_DELIVERY_MIN*100)}%"></i></div>`;
  if (!items.length) { container.innerHTML = '<div class="cart-empty"><span>🛒</span><h2>Your cart is empty</h2><p>Looks like you have not added anything yet.</p><a class="button button-accent" href="./category.html">Start shopping</a></div>'; return; }
  container.innerHTML = items.map((item) => `<article class="cart-item" data-cart-id="${item.id}"><div class="product-image"></div><div><span class="section-kicker">${item.badge}</span><h3>${item.name}</h3><p class="cart-item-meta">${item.description}</p><p class="cart-item-meta"><b>In stock</b> · FREE returns</p><div class="cart-item-actions"><div class="quantity-control"><button data-dec aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-inc aria-label="Increase quantity">+</button></div><button class="text-button" data-save>Save for later</button><button class="text-button" data-remove>Remove</button></div></div><div class="cart-item-price"><strong>${money(retailPrice(item)*item.quantity)}</strong><del>${money(retailOldPrice(item)*item.quantity)}</del><small>${discount(item)}% off</small></div></article>`).join('');
  items.forEach((item) => { const row=container.querySelector('[data-cart-id="'+item.id+'"]'); applyVisual(row.querySelector('.product-image'),item); row.querySelector('[data-dec]').addEventListener('click',()=>updateQuantity(item.id,item.quantity-1)); row.querySelector('[data-inc]').addEventListener('click',()=>updateQuantity(item.id,item.quantity+1)); row.querySelector('[data-remove]').addEventListener('click',()=>removeFromCart(item.id)); row.querySelector('[data-save]').addEventListener('click',()=>{wishlist.add(item.id);saveWishlist();removeFromCart(item.id);toast('Moved to your wishlist.');}); });
}
function renderRecommendations() {
  const grid=document.querySelector('#recommendedGrid'), template=document.querySelector('#productCardTemplate'); if(!grid||!template)return;
  products.filter((product)=>!cart[product.id]).slice(5,9).forEach((product)=>grid.appendChild(buildProductCard(product,template)));
}
function renderCheckout() {
  const container=document.querySelector('#checkoutItems'), form=document.querySelector('#checkoutForm'); if(!container||!form)return;
  const update=()=>{const items=cartItems(),subtotal=cartSubtotal(),delivery=deliveryFor(subtotal);document.querySelector('#checkoutSubtotal').textContent=money(subtotal);document.querySelector('#checkoutDelivery').textContent=delivery?money(delivery):'FREE';document.querySelector('#checkoutTotal').textContent=money(subtotal+delivery);document.querySelector('#placeOrderButton').disabled=!items.length;container.innerHTML=items.length?items.map((item)=>`<div class="mini-item" data-mini-id="${item.id}"><div class="product-image"></div><div><p>${item.name}</p><small>Qty ${item.quantity}</small></div><strong>${money(retailPrice(item)*item.quantity)}</strong></div>`).join(''):'<div class="cart-empty"><p>Your cart is empty.</p><a class="button button-primary" href="./category.html">Shop products</a></div>';items.forEach((item)=>applyVisual(container.querySelector('[data-mini-id="'+item.id+'"] .product-image'),item));};
  update();
  form.addEventListener('submit',(event)=>{event.preventDefault();const items=cartItems();if(!items.length){toast('Your cart is empty.');return;}const orderId='SP'+Date.now().toString().slice(-8);Object.keys(cart).forEach((key)=>delete cart[key]);saveCart();update();form.reset();const message=document.querySelector('#orderMessage');message.innerHTML=`<div class="success-card"><span>✓</span><h2>Order confirmed!</h2><p>Your demo order <strong>#${orderId}</strong> has been placed successfully.</p><p>No payment was processed.</p><a class="button button-accent full-width" href="./index.html">Continue shopping</a></div>`;message.hidden=false;});
}
function initSearch() {
  const form=document.querySelector('#searchForm'),input=document.querySelector('#headerSearch'),category=document.querySelector('#headerCategory');if(!form||!input)return;
  form.addEventListener('submit',(event)=>{event.preventDefault();const target=new URL('./category.html',location.href);if(input.value.trim())target.searchParams.set('q',input.value.trim());if(category?.value&&category.value!=='all')target.searchParams.set('category',category.value);location.href=target.toString();});
}
function initGlobalInteractions() {
  document.querySelectorAll('[data-toast]').forEach((node)=>node.addEventListener('click',(event)=>{event.preventDefault();toast(node.dataset.toast);}));
  const newsletter=document.querySelector('#newsletterForm');newsletter?.addEventListener('submit',(event)=>{event.preventDefault();toast('You are on the list. Watch your inbox for deals!','success');newsletter.reset();});
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape'){const modal=document.querySelector('#quickViewModal');if(modal&&!modal.hidden){modal.hidden=true;document.body.classList.remove('modal-open');}}});
}
function refreshCartViews(){if(currentPage==='cart.html')renderCart();if(currentPage==='checkout.html'){location.reload();}}
updateHeaderCounts();initSearch();initGlobalInteractions();
if(currentPage==='index.html'||currentPage==='')renderHome();
if(currentPage==='category.html')renderCatalog();
if(currentPage==='cart.html'){renderCart();renderRecommendations();}
if(currentPage==='checkout.html')renderCheckout();
window.addEventListener('storage',()=>{Object.keys(cart).forEach((key)=>delete cart[key]);Object.assign(cart,loadCart());wishlist.clear();loadJSON(WISHLIST_KEY,[]).forEach((id)=>wishlist.add(id));updateHeaderCounts();if(currentPage==='cart.html')renderCart();});
