# JB Jewellery Collection — Website Usage Manual

A complete guide to using and managing the JB Jewellery Collection website.

---

## Table of Contents

1. [For Customers — Shopping Guide](#for-customers)
2. [For Admin — Managing the Store](#for-admin)
   - [Accessing Admin Panel](#accessing-admin-panel)
   - [Dashboard](#dashboard)
   - [Products](#products)
   - [Categories](#categories)
   - [Orders](#orders)
   - [Coupons](#coupons)
   - [Customers](#customers)
   - [Reviews](#reviews)
   - [Email Templates](#email-templates)
   - [Site Settings](#site-settings)
   - [Invoices](#invoices)

---

## For Customers — Shopping Guide {#for-customers}

### Browsing Products

- **Homepage**: Shows hero banners, featured categories, bestsellers, new arrivals, and combo deals
- **Top navigation bar**: Click any category (Earrings, Necklaces, Chokers, Bracelets, Rings, Anklets, Hair Accessories, Combo Deals, Sale) to browse that collection
- **Search bar**: Type any product name or keyword to find items instantly
- **Sale page**: Shows all discounted items

### Shop by Category

| Category | What you'll find |
|----------|-----------------|
| Earrings | Studs, hoops, drops, tassels, jhumkas |
| Necklaces | Layered sets, chokers, chains, pendants |
| Chokers | Close-fit necklaces and collar styles |
| Bracelets | Chains, bangles, beaded sets, anklets |
| Rings | Finger rings, adjustable bands, sets |
| Hair Accessories | Clips, pins, scrunchies, headbands |
| Combo Deals | Buy multiple items at a bundle price |

### Product Page

- Tap any product card to open the detail view
- Browse multiple product images by tapping or swiping
- Select quantity
- Click **Add to Cart** or **Buy Now** (goes straight to checkout)
- Read customer reviews at the bottom

### Cart & Wishlist

- **Cart icon** (top right): shows item count. Click to open cart drawer
- **Heart icon** on any product: adds to Wishlist
- **Wishlist icon** (top right): view saved items
- In cart: change quantity or remove items
- See order total, applied discount, and estimated shipping

### Checkout

1. Open cart → click **Checkout**
2. **Login or continue as guest**
3. Fill in delivery address (Name, Phone, Address, City, State, Pincode)
4. Apply a coupon code (e.g., `JBFIRST` for 50% off up to ₹200)
5. Review order summary (items, shipping ₹50, tax)
6. Click **Place Order** — you'll receive an order confirmation email

### Coupon Codes

| Code | Discount | Minimum Order |
|------|----------|---------------|
| `JBFIRST` | 50% off (max ₹200) | ₹299 |
| `FLAT100` | ₹100 off | ₹599 |
| `WELCOME20` | 20% off (max ₹150) | ₹199 |

### Customer Account

**Sign Up**: Click **Login** in the top bar → Sign Up tab → fill in Name, Email, Phone, Password  
**Login**: Click **Login** → enter email and password  
**Forgot Password**: Click Login → Forgot Password → enter email → check inbox for reset link

**My Account (after login)**:
- Click your name/avatar in the top bar → Profile
- **Orders**: View all past orders and their status (Pending → Confirmed → Processing → Shipped → Delivered)
- **Addresses**: Save multiple delivery addresses, set default
- **Wishlist**: View and manage saved items
- **Reviews**: Leave or edit reviews for purchased products
- **Settings**: Update name, phone, and password

### Order Tracking

1. Login → click your name → **Orders**
2. Click any order to see full timeline (placed, confirmed, shipped, delivered)
3. You also receive email updates at each status change

### Combo Deals

- Visit **Combo Deals** in the navigation or homepage section
- Each combo shows: how many items to pick + fixed bundle price + bonus (e.g., Free Gift Wrap)
- Add any eligible products to cart → the combo price applies automatically at checkout

---

## For Admin — Managing the Store {#for-admin}

### Accessing Admin Panel {#accessing-admin-panel}

1. Go to `yourdomain.com/admin/login`
2. Enter your **Admin Email** and **Admin Password** (these are set in your environment variables: `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD`)
3. Check **Remember me** to stay logged in for 30 days
4. Click **Login to Admin Panel**

> The admin panel is completely separate from the customer login. Admin credentials are configured in environment variables, not Supabase.

---

### Dashboard {#dashboard}

The first page after login. Shows at a glance:

- **Total Orders** / **Pending Orders** / **Total Revenue** / **Products**
- **7-day revenue chart** — bar graph of orders and revenue per day
- **Order status breakdown** — how many pending, processing, shipped, delivered
- **Recent Orders** table — click any order to manage it

---

### Products {#products}

**Admin → Products**

#### Adding a New Product

1. Click **Add Product** (top right)
2. Fill in:
   - **Name** — product title (shown on storefront)
   - **Category** — Earrings, Necklaces, Rings, Bracelets, Hair Accessories, Combos
   - **Price** — selling price in ₹
   - **Original Price** — MRP (used to show discount %)
   - **Stock** — available quantity
   - **Description** — product details (shown on product page)
3. **Upload Images**: Click the image upload area. First image = main product image; add more for the gallery
4. Toggle **New Arrival** and/or **Bestseller** badges
5. Click **Save Product**

#### Editing a Product

- Click the **pencil icon** next to any product
- Change any field and click **Save**

#### Deleting a Product

- Click the **trash icon** next to any product
- Confirm deletion (this removes it from the storefront immediately)

#### Product Images

- Upload high-quality square images (recommended: 800×800 px minimum)
- You can upload multiple images — they appear as a gallery on the product page
- Drag images to reorder; first image is the thumbnail

---

### Categories {#categories}

**Admin → Categories**

Categories control what appears in the navigation and homepage sections. There are 4 types:

| Type | Purpose | Example |
|------|---------|---------|
| **main** | Top navbar categories | Earrings, Necklaces |
| **price** | "Under ₹X" shop-by-price sections | Under ₹99, Under ₹299 |
| **vibe** | Mood/aesthetic collections | Boss Babe Basic, Everyday Slay |
| **combo** | Bundle deal sections | Buy Any 4 @ ₹299 |

#### Adding a Category

1. Click **Add Category**
2. Choose **Type** first — this changes which fields appear:
   - **main**: Set Name, Slug, Image, Product Category (which product category it shows)
   - **price**: Set Name, Image, Max Price (all products at or below this price appear)
   - **vibe**: Set Name, Subtitle, Image, then assign specific products
   - **combo**: Set Name, Image, How many items (combo_count), Bundle price, Bonus text (e.g., "Free Gift Wrap")
3. **Assign Products** (for vibe and combo types): A product picker appears — search and select which products belong to this category
4. Toggle **Visible** to show/hide from storefront
5. Set **Sort Order** (lower number = appears first)

#### Editing a Category

- Click the **pencil icon**
- Update any field
- Click **Save**

---

### Orders {#orders}

**Admin → Orders**

#### Order List

Shows all orders sorted newest first. For each order:
- Order ID, Customer name, Amount, Status, Date
- **Eye icon** → View full order details
- **Status dropdown** → Change order status

#### Updating Order Status

1. Click the **status dropdown** for an order (or open order → status section)
2. Select new status: Pending → Confirmed → Processing → Shipped → Delivered (or Cancelled)
3. Add an optional **note** (e.g., tracking number, reason for cancellation)
4. Click **Update** — customer receives an email notification automatically

Order status flow:
```
Pending → Confirmed → Processing → Shipped → Delivered
                                             ↘ Cancelled (any stage)
```

#### Viewing Order Details

Click the **eye icon** on any order to see:
- All ordered items (image, name, price, quantity)
- Delivery address
- Price breakdown (subtotal, shipping, tax, discount, total)
- Customer contact info
- Full status history with timestamps
- Invoice download link (if generated)

#### Generating Invoices

1. Open an order → click **Generate Invoice** (or go to Admin → Invoices → New)
2. The system pre-fills all order details
3. Click **Preview** to see the PDF
4. Click **Send** to email it to the customer, or **Download** to save

---

### Coupons {#coupons}

**Admin → Coupons**

#### Adding a Coupon

1. Click **Add Coupon**
2. Fill in:
   - **Code** — what customers type (e.g., `SAVE50`)
   - **Type** — Percentage (%) or Flat amount (₹)
   - **Value** — discount amount (e.g., 50 for 50% or ₹50)
   - **Min Order** — minimum cart value to use this code
   - **Max Discount** — cap on the discount (for percentage coupons)
   - **Expiry Date** — leave blank for no expiry
   - **Usage Limit** — max number of uses total
3. Click **Save**

#### Editing / Deactivating a Coupon

- Click **edit** on any coupon
- Toggle **Active** to turn it on or off without deleting
- Click **Save**

---

### Customers {#customers}

**Admin → Customers**

Shows all registered customers with their name, email, phone, registration date, and address count.

#### Customer Actions

- **View** — see full customer profile including all saved addresses
- **Set Password** — reset a customer's password if they're locked out
- **Magic Link** — generate a one-click login link and share with the customer
- **Delete** — permanently remove the customer and all their data

#### Adding a Customer (Admin-created)

1. Click **Add Customer**
2. Enter Name, Email, Phone, Password
3. Optionally add their first delivery address
4. Click **Create** — the customer can log in immediately

---

### Reviews {#reviews}

**Admin → Reviews**

Manage all product reviews from customers.

- **Visibility toggle** — show or hide any review from the product page
- **Verified badge** — mark a review as verified purchase
- **Add Review** — manually add a review (for products you want to seed with reviews)
- **Delete** — remove inappropriate reviews

#### Adding a Review (Admin)

1. Click **Add Review**
2. Select the product
3. Enter customer name, rating (1–5 stars), and review text
4. Optionally upload review photos
5. Click **Submit** — appears on the product page immediately

---

### Email Templates {#email-templates}

**Admin → Email**

Preview and send test emails for all system templates:

| Template | When it's sent |
|----------|---------------|
| Order Confirmation | Customer places an order |
| Order Confirmed | Status changed to "Confirmed" |
| Order Shipped | Status changed to "Shipped" |
| Order Delivered | Status changed to "Delivered" |
| Welcome | New customer signs up |
| Login Alert | Customer logs in from new device |
| Password Reset | Customer requests password reset |
| Password Changed | Customer changes their password |
| New Signup (Admin) | Admin notification of new customer |
| New Order (Admin) | Admin notification of new order |

#### Sending a Test Email

1. Click **Preview** on any template to see how it looks
2. Click **Send Test** → enter an email address → click **Send**
3. Check your inbox — if it arrives, email is working correctly

---

### Site Settings {#site-settings}

**Admin → Settings**

Configure global store settings (features vary based on what's been added to settings — this panel can be extended by the developer to include things like store name, WhatsApp number, shipping settings, etc.)

---

### Invoices {#invoices}

**Admin → Invoices → Create New**

Create custom invoices (not linked to orders):

1. Fill in **Bill To** details (customer name, address, GSTIN if applicable)
2. Add **line items** — description, quantity, unit price, GST rate
3. Optionally fill **Ship To** if different from billing
4. Click **Preview** to see the formatted PDF invoice
5. Click **Send** to email it directly, or use the generated invoice number for your records

---

## Quick Reference — Admin URLs

| Page | URL |
|------|-----|
| Admin Login | `/admin/login` |
| Dashboard | `/admin` |
| Orders | `/admin/orders` |
| Products | `/admin/products` |
| Categories | `/admin/categories` |
| Coupons | `/admin/coupons` |
| Customers | `/admin/customers` |
| Reviews | `/admin/reviews` |
| Email Templates | `/admin/email` |
| Create Invoice | `/admin/invoices/new` |
| Site Settings | `/admin/settings` |

---

## Quick Reference — Customer URLs

| Page | URL |
|------|-----|
| Home | `/` |
| Earrings | `/shop/earrings` |
| Necklaces | `/shop/necklaces` |
| Bracelets | `/shop/bracelets` |
| Rings | `/shop/rings` |
| Hair Accessories | `/shop/hair-accessories` |
| Combo Deals | `/combo-deals` |
| Sale | `/sale` |
| My Orders | `/my-orders` |
| My Profile | `/profile` |
| Wishlist | `/wishlist` |
