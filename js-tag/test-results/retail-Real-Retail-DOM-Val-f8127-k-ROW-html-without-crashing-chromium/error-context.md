# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: retail.test.js >> Real Retail DOM Validation >> AIORA Tag safely fires on Checkout - Gymshark ROW.html without crashing
- Location: tests\browser\retail.test.js:26:5

# Error details

```
Error: expect(received).not.toBeNull()

Received: null
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic:
    - banner:
      - generic:
        - generic:
          - heading "Gymshark ROW" [level=1]:
            - img "Gymshark ROW"
    - generic:
      - generic:
        - generic:
          - main
      - generic:
        - generic:
          - complementary:
            - generic:
              - heading [level=2]
  - generic [ref=e2]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - link "Skip to content" [ref=e7] [cursor=pointer]:
          - /url: "#checkout-main"
        - generic [ref=e8]:
          - banner [ref=e9]:
            - link "Gymshark ROWNavigate to Online Store" [ref=e17] [cursor=pointer]:
              - /url: https://row.checkout.gymshark.com/
              - img "Gymshark ROW" [ref=e18]
              - text: Navigate to Online Store
          - complementary [ref=e19]:
            - button "Order summaryTotal price$269.50Discounted price $218.70" [ref=e22]:
              - generic [ref=e23]:
                - generic [ref=e24]:
                  - text: Order summary
                  - img [ref=e26]
                - generic [ref=e27]:
                  - text: Total price$269.50Discounted price
                  - paragraph [ref=e29]:
                    - strong [ref=e30]: $218.70
          - generic [ref=e31]:
            - generic [ref=e33]:
              - main [ref=e34]:
                - heading "Gymshark ROW Checkout" [level=1] [ref=e35]
                - generic [ref=e37]:
                  - generic [ref=e38]:
                    - generic [ref=e39]:
                      - region "Express checkout" [ref=e40]:
                        - generic [ref=e44]:
                          - heading "Express checkout" [level=2] [ref=e46]
                          - generic [ref=e47]:
                            - generic:
                              - list
                            - button "Show more options" [ref=e49]:
                              - generic [ref=e51]:
                                - text: Show more options
                                - img [ref=e53]
                      - generic [ref=e56]:
                        - paragraph [ref=e57]: OR
                        - separator
                    - region "Contact" [ref=e58]:
                      - generic [ref=e62]:
                        - generic [ref=e63]:
                          - heading "Contact" [level=2] [ref=e64]
                          - link "Sign in" [ref=e65] [cursor=pointer]:
                            - /url: https://row.checkout.gymshark.com/account/login?checkout_url=%2Fcheckouts%2Fcn%2FhWNDkKUvxSBIJbwBxX7i4Mbs%2Fen-mx%3F_gl%3D1%252A5w8gze%252A_gcl_au%252AMjEwNjExNjU1LjE3ODIzODgzMDM.%252A_ga%252AMzY4MDIwODMuMTc4MjM4ODMwMw..%252A_ga_PQJ0N2K1QF%252AczE3ODIzODgzMDIkbzEkZzEkdDE3ODIzOTAwMzgkajU5JGwwJGgw%26_r%3DAQABlgrLVq38HeDrdOeyq6yJvv2bQEiGDna88dq4hDkP8JI%26company_location_id%26locale%3Den-MX
                        - generic [ref=e66]:
                          - generic [ref=e72]:
                            - generic [ref=e74]: Email
                            - textbox "Email" [active] [ref=e75]
                            - button "More information about how your contact info is used" [ref=e77]
                          - generic [ref=e80]:
                            - generic [ref=e81]:
                              - checkbox "Tick here to receive emails about our products, apps, sales, exclusive content and more." [ref=e82]
                              - img [ref=e85]
                            - text: Tick here to receive emails about our products, apps, sales, exclusive content and more.
                    - group "Delivery" [ref=e90]:
                      - generic [ref=e91]:
                        - heading "Delivery" [level=2] [ref=e93]
                        - generic [ref=e98]:
                          - generic [ref=e102]:
                            - generic [ref=e103]:
                              - generic [ref=e107]:
                                - generic [ref=e109]: Country/Region
                                - combobox "Country/Region" [ref=e110]:
                                  - option "Mexico"
                                  - option "Israel"
                                  - option "Singapore"
                                  - option "Philippines"
                                  - option "Malaysia"
                                  - option "Algeria"
                                  - option "Anguilla"
                                  - option "Antigua & Barbuda"
                                  - option "Argentina"
                                  - option "Aruba"
                                  - option "Azerbaijan"
                                  - option "Bahamas"
                                  - option "Bangladesh"
                                  - option "Barbados"
                                  - option "Belize"
                                  - option "Benin"
                                  - option "Bermuda"
                                  - option "Bhutan"
                                  - option "Bolivia"
                                  - option "Botswana"
                                  - option "Brazil"
                                  - option "British Indian Ocean Territory"
                                  - option "British Virgin Islands"
                                  - option "Brunei"
                                  - option "Burkina Faso"
                                  - option "Cameroon"
                                  - option "Cape Verde"
                                  - option "Cayman Islands"
                                  - option "Chad"
                                  - option "Chile"
                                  - option "China"
                                  - option "Christmas Island"
                                  - option "Cocos (Keeling) Islands"
                                  - option "Colombia"
                                  - option "Comoros"
                                  - option "Congo - Brazzaville"
                                  - option "Cook Islands"
                                  - option "Costa Rica"
                                  - option "Curaçao"
                                  - option "Côte d’Ivoire"
                                  - option "Djibouti"
                                  - option "Dominica"
                                  - option "Dominican Republic"
                                  - option "Ecuador"
                                  - option "Egypt"
                                  - option "El Salvador"
                                  - option "Equatorial Guinea"
                                  - option "Eswatini"
                                  - option "Ethiopia"
                                  - option "Falkland Islands"
                                  - option "Fiji"
                                  - option "French Guiana"
                                  - option "French Polynesia"
                                  - option "French Southern Territories"
                                  - option "Gabon"
                                  - option "Gambia"
                                  - option "Ghana"
                                  - option "Grenada"
                                  - option "Guatemala"
                                  - option "Guyana"
                                  - option "Honduras"
                                  - option "Hong Kong SAR"
                                  - option "Indonesia"
                                  - option "Israel"
                                  - option "Jamaica"
                                  - option "Japan"
                                  - option "Jordan"
                                  - option "Kazakhstan"
                                  - option "Kenya"
                                  - option "Kiribati"
                                  - option "Kyrgyzstan"
                                  - option "Laos"
                                  - option "Lesotho"
                                  - option "Liberia"
                                  - option "Macao SAR"
                                  - option "Madagascar"
                                  - option "Malawi"
                                  - option "Malaysia"
                                  - option "Maldives"
                                  - option "Martinique"
                                  - option "Mauritania"
                                  - option "Mauritius"
                                  - option "Mayotte"
                                  - option "Mexico" [selected]
                                  - option "Mongolia"
                                  - option "Montserrat"
                                  - option "Morocco"
                                  - option "Mozambique"
                                  - option "Namibia"
                                  - option "Nauru"
                                  - option "Nepal"
                                  - option "New Caledonia"
                                  - option "Niger"
                                  - option "Nigeria"
                                  - option "Niue"
                                  - option "Norfolk Island"
                                  - option "Panama"
                                  - option "Papua New Guinea"
                                  - option "Paraguay"
                                  - option "Peru"
                                  - option "Philippines"
                                  - option "Pitcairn Islands"
                                  - option "Samoa"
                                  - option "São Tomé & Príncipe"
                                  - option "Senegal"
                                  - option "Seychelles"
                                  - option "Sierra Leone"
                                  - option "Singapore"
                                  - option "Sint Maarten"
                                  - option "Solomon Islands"
                                  - option "South Africa"
                                  - option "South Korea"
                                  - option "Sri Lanka"
                                  - option "St. Helena"
                                  - option "St. Kitts & Nevis"
                                  - option "St. Lucia"
                                  - option "St. Vincent & Grenadines"
                                  - option "Suriname"
                                  - option "Svalbard & Jan Mayen"
                                  - option "Taiwan"
                                  - option "Tajikistan"
                                  - option "Tanzania"
                                  - option "Thailand"
                                  - option "Timor-Leste"
                                  - option "Togo"
                                  - option "Tokelau"
                                  - option "Tonga"
                                  - option "Trinidad & Tobago"
                                  - option "Tunisia"
                                  - option "Türkiye"
                                  - option "Turks & Caicos Islands"
                                  - option "Tuvalu"
                                  - option "Uganda"
                                  - option "Uruguay"
                                  - option "Uzbekistan"
                                  - option "Vanuatu"
                                  - option "Vietnam"
                                  - option "Wallis & Futuna"
                                  - option "Western Sahara"
                                  - option "Zambia"
                                - img [ref=e113]
                              - generic [ref=e114]:
                                - generic [ref=e116]:
                                  - generic [ref=e118]: First name
                                  - textbox "First name" [ref=e119]: fake
                                - generic [ref=e121]:
                                  - generic [ref=e123]: Last name
                                  - textbox "Last name" [ref=e124]: test
                              - generic [ref=e129]:
                                - generic [ref=e131]: Address Line 1
                                - textbox "Address Line 1" [ref=e132]: house no. 2, 2first street
                              - generic [ref=e135]:
                                - generic [ref=e137]: Address Line 2
                                - textbox "Address Line 2" [ref=e138]: mexico
                              - generic [ref=e139]:
                                - generic [ref=e142]:
                                  - generic [ref=e144]: Postal code
                                  - textbox "Postal code" [ref=e145]: "63330"
                                - generic [ref=e147]:
                                  - generic [ref=e149]: City
                                  - textbox "City" [ref=e150]: Mexico City
                                - generic [ref=e153]:
                                  - generic [ref=e155]: State
                                  - combobox "State" [ref=e156]:
                                    - option "Aguascalientes"
                                    - option "Baja California"
                                    - option "Baja California Sur"
                                    - option "Campeche"
                                    - option "Chiapas"
                                    - option "Chihuahua"
                                    - option "Ciudad de Mexico"
                                    - option "Coahuila"
                                    - option "Colima"
                                    - option "Durango"
                                    - option "Guanajuato"
                                    - option "Guerrero"
                                    - option "Hidalgo"
                                    - option "Jalisco"
                                    - option "Mexico State" [selected]
                                    - option "Michoacán"
                                    - option "Morelos"
                                    - option "Nayarit"
                                    - option "Nuevo León"
                                    - option "Oaxaca"
                                    - option "Puebla"
                                    - option "Querétaro"
                                    - option "Quintana Roo"
                                    - option "San Luis Potosí"
                                    - option "Sinaloa"
                                    - option "Sonora"
                                    - option "Tabasco"
                                    - option "Tamaulipas"
                                    - option "Tlaxcala"
                                    - option "Veracruz"
                                    - option "Yucatán"
                                    - option "Zacatecas"
                                  - img [ref=e159]
                              - generic [ref=e162]:
                                - generic [ref=e164]: Phone
                                - textbox "Phone" [ref=e165]
                                - button "More information about Phone" [ref=e168]
                            - generic [ref=e169]:
                              - textbox [ref=e170]: fake
                              - textbox [ref=e171]: test
                              - textbox [ref=e172]: house no. 2, 2first street
                              - textbox [ref=e173]: mexico
                              - textbox [ref=e174]: Mexico City
                              - textbox [ref=e175]: MX
                              - textbox [ref=e176]: MEX
                              - textbox [ref=e177]: MEX
                              - textbox [ref=e178]: MEX
                              - textbox [ref=e179]: "63330"
                              - textbox [ref=e180]
                          - generic [ref=e181]:
                            - heading "Shipping method" [level=2] [ref=e182]
                            - group "Choose a shipping method" [ref=e190]:
                              - generic [ref=e191]: Choose a shipping method
                              - group [ref=e192]:
                                - generic [ref=e195]:
                                  - heading "Express (3-5 Working Days)" [level=3] [ref=e197]:
                                    - paragraph [ref=e198]:
                                      - strong [ref=e199]: Express (3-5 Working Days)
                                  - strong [ref=e201]: $15.50
                  - button [ref=e203]: Submit
              - contentinfo [ref=e204]:
                - list [ref=e208]:
                  - listitem [ref=e209]:
                    - button "Refund policy" [ref=e210]
                  - listitem [ref=e211]:
                    - button "Privacy policy" [ref=e212]
                  - listitem [ref=e213]:
                    - button "Terms of service" [ref=e214]
            - complementary [ref=e217]:
              - generic [ref=e221]:
                - heading "Order summary" [level=2] [ref=e222]
                - generic [ref=e225]:
                  - region "Shopping cart" [ref=e226]:
                    - heading "Shopping cart" [level=3] [ref=e228]
                    - table "Shopping cart" [ref=e229]:
                      - rowgroup [ref=e230]:
                        - row "Product image Description Quantity Price" [ref=e231]:
                          - columnheader "Product image" [ref=e232]
                          - columnheader "Description" [ref=e233]
                          - columnheader "Quantity" [ref=e234]
                          - columnheader "Price" [ref=e235]
                      - rowgroup [ref=e236]:
                        - row "Quantity1 Power T-Shirt - Black/Conditioning Red Medium 1 $36.00" [ref=e237]:
                          - cell "Quantity1" [ref=e238]:
                            - generic [ref=e241]: Quantity1
                          - cell "Power T-Shirt - Black/Conditioning Red Medium" [ref=e242]:
                            - generic [ref=e243]:
                              - paragraph [ref=e244]: Power T-Shirt - Black/Conditioning Red
                              - generic [ref=e245]:
                                - paragraph [ref=e246]: Medium
                                - list
                          - cell "1" [ref=e247]:
                            - generic [ref=e248]: "1"
                          - cell "$36.00" [ref=e249]:
                            - generic [ref=e250]: $36.00
                        - row "Quantity1 Figure 8 Lifting Straps - Black 1 $12.50" [ref=e251]:
                          - cell "Quantity1" [ref=e252]:
                            - generic [ref=e255]: Quantity1
                          - cell "Figure 8 Lifting Straps - Black" [ref=e256]:
                            - generic [ref=e257]:
                              - paragraph [ref=e258]: Figure 8 Lifting Straps - Black
                              - generic:
                                - list
                          - cell "1" [ref=e259]:
                            - generic [ref=e260]: "1"
                          - cell "$12.50" [ref=e261]:
                            - generic [ref=e262]: $12.50
                        - row "Quantity1 Ribbed Tank 1PK - Black Small 1 $18.00" [ref=e263]:
                          - cell "Quantity1" [ref=e264]:
                            - generic [ref=e267]: Quantity1
                          - cell "Ribbed Tank 1PK - Black Small" [ref=e268]:
                            - generic [ref=e269]:
                              - paragraph [ref=e270]: Ribbed Tank 1PK - Black
                              - generic [ref=e271]:
                                - paragraph [ref=e272]: Small
                                - list
                          - cell "1" [ref=e273]:
                            - generic [ref=e274]: "1"
                          - cell "$18.00" [ref=e275]:
                            - generic [ref=e276]: $18.00
                        - row "Quantity1 Everyday Mini Holdall - Pebble Grey 1 $16.00" [ref=e277]:
                          - cell "Quantity1" [ref=e278]:
                            - generic [ref=e281]: Quantity1
                          - cell "Everyday Mini Holdall - Pebble Grey" [ref=e282]:
                            - generic [ref=e283]:
                              - paragraph [ref=e284]: Everyday Mini Holdall - Pebble Grey
                              - generic:
                                - list
                          - cell "1" [ref=e285]:
                            - generic [ref=e286]: "1"
                          - cell "$16.00" [ref=e287]:
                            - generic [ref=e288]: $16.00
                        - row "Quantity1 Mini Tactical Backpack - Black 1 $45.00" [ref=e289]:
                          - cell "Quantity1" [ref=e290]:
                            - generic [ref=e293]: Quantity1
                          - cell "Mini Tactical Backpack - Black" [ref=e294]:
                            - generic [ref=e295]:
                              - paragraph [ref=e296]: Mini Tactical Backpack - Black
                              - generic:
                                - list
                          - cell "1" [ref=e297]:
                            - generic [ref=e298]: "1"
                          - cell "$45.00" [ref=e299]:
                            - generic [ref=e300]: $45.00
                        - row "Quantity1 Arrival 5\" Shorts - Black Medium 1 $24.00" [ref=e301]:
                          - cell "Quantity1" [ref=e302]:
                            - generic [ref=e305]: Quantity1
                          - cell "Arrival 5\" Shorts - Black Medium" [ref=e306]:
                            - generic [ref=e307]:
                              - paragraph [ref=e308]: Arrival 5" Shorts - Black
                              - generic [ref=e309]:
                                - paragraph [ref=e310]: Medium
                                - list
                          - cell "1" [ref=e311]:
                            - generic [ref=e312]: "1"
                          - cell "$24.00" [ref=e313]:
                            - generic [ref=e314]: $24.00
                        - row "Quantity1 Silicone Lifting Straps - Black 1 $12.50" [ref=e315]:
                          - cell "Quantity1" [ref=e316]:
                            - generic [ref=e319]: Quantity1
                          - cell "Silicone Lifting Straps - Black" [ref=e320]:
                            - generic [ref=e321]:
                              - paragraph [ref=e322]: Silicone Lifting Straps - Black
                              - generic:
                                - list
                          - cell "1" [ref=e323]:
                            - generic [ref=e324]: "1"
                          - cell "$12.50" [ref=e325]:
                            - generic [ref=e326]: $12.50
                        - row "Quantity1 Pumper Pants - Black Medium 1 $48.00" [ref=e327]:
                          - cell "Quantity1" [ref=e328]:
                            - generic [ref=e331]: Quantity1
                          - cell "Pumper Pants - Black Medium" [ref=e332]:
                            - generic [ref=e333]:
                              - paragraph [ref=e334]: Pumper Pants - Black
                              - generic [ref=e335]:
                                - paragraph [ref=e336]: Medium
                                - list
                          - cell "1" [ref=e337]:
                            - generic [ref=e338]: "1"
                          - cell "$48.00" [ref=e339]:
                            - generic [ref=e340]: $48.00
                        - row "Quantity1 Crest Oversized Hoodie - Black Small 1 $42.00" [ref=e341]:
                          - cell "Quantity1" [ref=e342]:
                            - generic [ref=e345]: Quantity1
                          - cell "Crest Oversized Hoodie - Black Small" [ref=e346]:
                            - generic [ref=e347]:
                              - paragraph [ref=e348]: Crest Oversized Hoodie - Black
                              - generic [ref=e349]:
                                - paragraph [ref=e350]: Small
                                - list
                          - cell "1" [ref=e351]:
                            - generic [ref=e352]: "1"
                          - cell "$42.00" [ref=e353]:
                            - generic [ref=e354]: $42.00
                  - generic [ref=e357]:
                    - text: Scroll for more items
                    - img [ref=e359]
                - generic [ref=e362]:
                  - heading "Gift Card, Redemption or Discount code" [level=3] [ref=e363]
                  - generic [ref=e364]:
                    - generic [ref=e365]:
                      - generic [ref=e367]:
                        - generic [ref=e369]:
                          - generic [ref=e371]:
                            - generic [ref=e373]: Gift Card, Redemption or Discount code
                            - textbox "Gift Card, Redemption or Discount code" [ref=e374]
                          - button "Apply Discount Code" [disabled] [ref=e375]: Apply
                        - button [ref=e377]: Submit
                      - list "Gift Card, Redemption or Discount code" [ref=e381]:
                        - listitem [ref=e382]:
                          - group [ref=e383]:
                            - generic [ref=e385]:
                              - generic [ref=e386]:
                                - img [ref=e389]
                                - generic [ref=e391]: EXTRA20
                              - text: EXTRA20
                            - button "Remove EXTRA20" [ref=e392]
                    - button "Back to finalize order" [ref=e394]:
                      - generic [ref=e396]:
                        - img [ref=e398]
                        - text: Back to finalize order
                - generic [ref=e399]:
                  - heading "Cost summary" [level=3] [ref=e401]
                  - table "Cost summary" [ref=e402]:
                    - rowgroup [ref=e403]:
                      - row "Item Value" [ref=e404]:
                        - columnheader "Item" [ref=e405]
                        - columnheader "Value" [ref=e406]
                    - rowgroup [ref=e407]:
                      - row "Subtotal · 9 items $254.00" [ref=e408]:
                        - rowheader "Subtotal · 9 items" [ref=e409]
                        - cell "$254.00" [ref=e410]
                      - row "Order discount" [ref=e411]:
                        - rowheader "Order discount" [ref=e412]:
                          - generic [ref=e413]: Order discount
                      - row "EXTRA20 − $50.80" [ref=e414]:
                        - rowheader "EXTRA20" [ref=e415]:
                          - generic [ref=e416]:
                            - img [ref=e418]
                            - generic [ref=e419]: EXTRA20
                        - cell "− $50.80" [ref=e420]
                      - row "Shipping $15.50" [ref=e421]:
                        - rowheader "Shipping" [ref=e422]:
                          - generic [ref=e423]: Shipping
                        - cell "$15.50" [ref=e424]:
                          - generic [ref=e426]: $15.50
                          - text: $15.50
                      - row "Total USD$218.70" [ref=e427]:
                        - rowheader "Total" [ref=e428]:
                          - strong [ref=e429]: Total
                        - cell "USD$218.70" [ref=e430]:
                          - generic [ref=e431]:
                            - generic [ref=e432]: USD
                            - strong [ref=e433]:
                              - generic [ref=e434]: $218.70
                            - strong [ref=e435]: $218.70
                      - row "TOTAL SAVINGS$50.80" [ref=e436]:
                        - rowheader "TOTAL SAVINGS$50.80" [ref=e437]:
                          - generic [ref=e438]:
                            - img [ref=e440]
                            - strong [ref=e441]: TOTAL SAVINGS
                            - strong [ref=e442]: $50.80
                        - cell
      - progressbar [ref=e445]
    - generic [ref=e446]: Opens external website in a new window.
    - generic [ref=e447]: Opens in a new window.
    - generic [ref=e448]: Opens external website.
    - status
    - alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import fs from 'fs';
  3  | import path from 'path';
  4  | import { fileURLToPath } from 'url';
  5  | 
  6  | const __filename = fileURLToPath(import.meta.url);
  7  | const __dirname = path.dirname(__filename);
  8  | const retailDir = path.resolve(__dirname, '../fixtures/retail-pages');
  9  | 
  10 | // Create directory if it doesn't exist to prevent crashes
  11 | if (!fs.existsSync(retailDir)) {
  12 |   fs.mkdirSync(retailDir, { recursive: true });
  13 | }
  14 | 
  15 | const htmlFiles = fs.readdirSync(retailDir).filter(f => f.endsWith('.html'));
  16 | 
  17 | test.describe('Real Retail DOM Validation', () => {
  18 |   if (htmlFiles.length === 0) {
  19 |     test('Waiting for retail HTML files', () => {
  20 |       console.log('Drop your real-world HTML files into tests/fixtures/retail-pages/');
  21 |       expect(true).toBe(true);
  22 |     });
  23 |   }
  24 | 
  25 |   for (const file of htmlFiles) {
  26 |     test(`AIORA Tag safely fires on ${file} without crashing`, async ({ page }) => {
  27 |       const htmlContent = fs.readFileSync(path.resolve(retailDir, file), 'utf-8');
  28 |       
  29 |       // Track any errors thrown by the page
  30 |       const pageErrors = [];
  31 |       page.on('pageerror', err => pageErrors.push(err.message));
  32 | 
  33 |       let payload = null;
  34 |       // Intercept the tag's POST request to collect data
  35 |       await page.route('**/api/collect', async route => {
  36 |         const req = route.request();
  37 |         if (req.method() === 'POST') {
  38 |           try {
  39 |             payload = JSON.parse(req.postData());
  40 |           } catch(e) {}
  41 |         }
  42 |         await route.fulfill({ status: 200, body: '{"ok":true}' });
  43 |       });
  44 | 
  45 |       // Serve our local tag.js file
  46 |       await page.route('**/tag.js', route => route.fulfill({ path: path.resolve(__dirname, '../../../src/tag.js') }));
  47 |       
  48 |       // Inject tag script into the real-world HTML if it's not already there
  49 |       let injectedHtml = htmlContent;
  50 |       if (!injectedHtml.includes('tag.js')) {
  51 |         injectedHtml = injectedHtml.replace(
  52 |           '</body>', 
  53 |           `<script src="./tag.js" data-client-id="gymshark-demo" data-endpoint="/api/collect" async></script></body>`
  54 |         );
  55 |       }
  56 | 
  57 |       // Start waiting for the collect request BEFORE setting content
  58 |       const requestPromise = page.waitForRequest('**/api/collect', { timeout: 15000 }).catch(() => null);
  59 | 
  60 |       // Load the heavy DOM (only wait for domcontentloaded so dead image links don't block us)
  61 |       await page.setContent(injectedHtml, { waitUntil: 'domcontentloaded' });
  62 |       
  63 |       // Wait for the tag to fire its payload
  64 |       await requestPromise;
  65 | 
  66 |       // 1. Ensure the tag successfully collected and transmitted data
> 67 |       expect(payload).not.toBeNull();
     |                           ^ Error: expect(received).not.toBeNull()
  68 |       expect(payload.client_id).toBe('gymshark-demo');
  69 |       expect(payload.schema_version).toBeDefined();
  70 | 
  71 |       // 3. Ensure the payload size is reasonable (avoiding explosive heavy DOM serialization)
  72 |       const payloadSizeKB = JSON.stringify(payload).length / 1024;
  73 |       expect(payloadSizeKB).toBeLessThan(100); // Should easily be under 100kb even on heavy pages
  74 |       
  75 |       // 4. Basic PII check: No credit card shaped numbers in the extracted text
  76 |       const payloadString = JSON.stringify(payload).toLowerCase();
  77 |       expect(payloadString).not.toMatch(/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/); 
  78 |     });
  79 |   }
  80 | });
  81 | 
```