# SHOPORA

A responsive multi-page ecommerce demo with product search, filters, wishlist, cart, checkout, custom product photos, and locally stored shopping data.

## Run the Project

For complete beginner-friendly instructions, read:

**[How to Run SHOPORA](HOW-TO-RUN.md)**

Quick start from PowerShell:

```powershell
cd "I:\JS TAG\js-tag\Shopora"
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Pages

- `index.html` — storefront homepage
- `category.html` — searchable and filterable product catalog
- `cart.html` — editable shopping cart
- `checkout.html` — demo checkout flow

## Notes

- Product data is stored in `data/products.js`.
- Custom photos can be placed in `assets/products`.
- Cart and wishlist data use browser local storage.
- Checkout is a frontend demonstration; no real payment is processed.
