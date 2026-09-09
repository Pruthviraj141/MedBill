You are working on a paid production-oriented café POS application.

IMPORTANT:
Do not throw away the existing project. Inspect the current codebase first and improve it in place.
Do not invent fake business data, fake sales numbers, fake orders, fake analytics, fake customers, or fake inventory values.
If real backend data is unavailable, show honest empty/loading states, zero values where appropriate, or "No data yet". Never fabricate numbers just to make the UI look populated.

TECH STACK — DO NOT CHANGE:
- React
- Vite
- TypeScript
- Capacitor
- Hono backend
- MongoDB Atlas
- SQLite/local persistence for offline use
- Mobile-first Android application
- Desktop is secondary

PRIMARY GOAL:
Turn the current V1 into a polished, premium, mobile-first café billing application that feels like a real modern POS product, not a web dashboard inside a phone.

==================================================
1. FIRST INSPECT THE EXISTING PROJECT
==================================================

Before changing anything:
- Inspect all existing frontend files.
- Inspect backend files.
- Inspect package.json files.
- Understand the current routing/state structure.
- Preserve working functionality.
- Identify placeholders, hardcoded fake numbers, duplicated code, and weak architecture.
- Do not rewrite the entire project unnecessarily.

Create a clean implementation plan internally, then execute it.

==================================================
2. MOBILE UX IS THE PRIORITY
==================================================

Design for an Android phone first.

Target common phone dimensions around:
- 360–430px width
- portrait orientation
- touch-first interaction

Do not design this like a desktop website compressed into a phone.

The interface must feel:
- fast
- premium
- calm
- highly readable
- one-hand friendly
- visually modern
- operationally efficient for a cashier

Use:
- large touch targets
- strong typography hierarchy
- generous spacing
- clear visual grouping
- subtle elevation
- rounded surfaces where appropriate
- polished cards
- smooth transitions
- sticky bottom actions when useful

Avoid:
- excessive gradients
- giant decorative illustrations
- unnecessary glassmorphism everywhere
- tiny buttons
- desktop-style tables on mobile
- visual clutter
- excessive animation
- fake KPI numbers

==================================================
3. DESIGN SYSTEM
==================================================

Create a consistent design system using reusable components.

Establish:
- typography scale
- spacing scale
- radius scale
- button variants
- card variants
- input styles
- status badges
- bottom navigation
- top app bar
- modal/bottom sheet styles
- toast/notification styles
- empty states
- loading skeletons

Use Lucide icons or an existing icon system consistently.

The visual hierarchy should make the most important action obvious.

Primary POS actions should feel tactile.

==================================================
4. MAIN APP NAVIGATION
==================================================

Create a polished mobile navigation structure:

Bottom navigation:

1. Home
2. Billing
3. Orders
4. Products
5. More

Keep the active state visually obvious.

The Billing screen must be extremely fast to access.

Use smooth navigation transitions without over-animating.

==================================================
5. HOME / DASHBOARD
==================================================

Build a premium mobile dashboard.

Do NOT show fabricated business numbers.

Dashboard structure:

Header:
- café name
- current date
- connection/sync status
- profile/settings entry

Hero summary:
- Today's Revenue
- Today's Orders
- Average Bill

If no real data exists:
- show ₹0
- show 0 orders
- show ₹0 average
- make it obvious these are current real values, not demo values

Analytics section:
- Today
- This Week
- This Month

Include a clean sales trend visualization.

Also include:
- Peak order time
- Top-selling items
- Payment method breakdown
- Low-stock alerts
- Recent orders

If there is no real data:
- show useful empty states such as "No sales yet today"
- do not invent bars, percentages, revenue, or product rankings

Design analytics to remain readable on a small screen.

Avoid forcing too much information onto one screen.

==================================================
6. BILLING SCREEN — MOST IMPORTANT SCREEN
==================================================

This is the core of the product.

Build a fast cashier workflow.

Top:
- search products
- optional scan button placeholder for future barcode support

Category chips:
- All
- Coffee
- Tea
- Snacks
- Meals
- etc.

Product grid:
- large touch-friendly cards
- product name
- price
- optional image
- availability status

When tapping a product:
- add to cart
- animate subtle confirmation
- update cart immediately

Cart:
- selected items
- quantity controls
- remove action
- subtotal
- discount
- tax
- grand total

The checkout action must always be easy to reach.

Use a sticky bottom cart summary where appropriate.

==================================================
7. CHECKOUT FLOW
==================================================

Create a clean checkout sequence:

Cart
→ Review
→ Payment
→ Success

Payment screen:
- total amount large and clear
- Cash
- UPI
- Card
- Other

Do not pretend that online payment integration already exists.

For now, payment method selection should be a real local state and backend-ready.

After payment success:

Create a beautiful success state inspired by high-quality mobile payment apps.

Example interaction:

- screen subtly dims
- success circle appears
- checkmark animates/draws in
- gentle scale/fade animation
- "Payment successful"
- invoice number / bill reference when available
- print status
- "New Bill" primary action
- "View Order" secondary action

Do not use excessive confetti.

The success animation should feel premium and fast, around a few hundred milliseconds.

==================================================
8. ORDERS
==================================================

Create a mobile-first Orders screen.

Sections:
- Today
- Yesterday
- Older

Each order card should show:
- invoice/order number
- time
- item count
- total
- payment method
- status

Tapping an order opens:
- full items
- totals
- payment
- timestamps
- print/reprint action placeholder
- cancellation/refund controls placeholder where appropriate

Do not create fake orders.

Use the real local/API data source when available.

==================================================
9. PRODUCTS
==================================================

Create a mobile-first product management screen.

Features:
- search
- categories
- product list
- add product
- edit product
- active/inactive state
- price
- stock/availability indicator

Use bottom sheets or full-screen mobile forms instead of desktop-style modal dialogs.

Form validation should be clear.

Never silently accept invalid prices or empty product names.

==================================================
10. MORE / SETTINGS
==================================================

Create a polished More screen with grouped settings:

Business
- Café profile
- Tax/GST settings
- Invoice settings

Printer
- Printers
- Default printer
- Test print

Users
- Staff
- Roles

System
- Offline/sync status
- Data
- About

Do not implement fake printer connectivity.
Show actual state where possible.
Use "Not connected" rather than pretending a printer exists.

==================================================
11. OFFLINE UX
==================================================

Implement the UI architecture needed for offline-first behavior.

The app must clearly communicate:

Online
Offline
Syncing
Sync complete
Sync failed

Do not block the entire app because the internet is unavailable.

Create a reusable sync status indicator.

For now, structure the code so SQLite/local persistence can be integrated cleanly without coupling UI components directly to storage implementation.

==================================================
12. REAL DATA ARCHITECTURE
==================================================

Create clean data/service boundaries.

The React frontend should NOT directly know MongoDB credentials.

Architecture:

React + Capacitor
        ↓
service/API layer
        ↓
Hono API
        ↓
MongoDB Atlas

Local mobile data:
React + Capacitor
        ↓
SQLite/local storage layer

Create clear service modules for:
- auth
- products
- orders
- reports
- customers
- inventory
- sync

Do not scatter fetch() calls throughout UI components.

==================================================
13. ENVIRONMENT VARIABLES
==================================================

Use environment variables.

Do NOT hardcode:
- MongoDB URI
- auth secrets
- API URLs
- production credentials

Support:
VITE_API_BASE_URL

Backend environment variables should include placeholders for:
MONGODB_URI
MONGODB_DB_NAME
AUTH_SECRET
WEB_ORIGIN

Use secure secret handling on the backend.

Never expose MONGODB_URI to the browser/mobile client.

==================================================
14. Hono BACKEND FOUNDATION
==================================================

Do not build a fake backend.

Create clean Hono routes/services for:

GET  /api/health
POST /api/auth/login
GET  /api/products
POST /api/products
PATCH /api/products/:id
GET  /api/orders
GET  /api/orders/:id
POST /api/orders
GET  /api/reports/today
GET  /api/reports/week
GET  /api/reports/month
POST /api/sync

Use:
- TypeScript
- validation
- structured errors
- proper HTTP status codes
- environment variables

Do not return fabricated analytics.

If the database is unavailable, return a real error and let the UI display a useful error state.

==================================================
15. PERFORMANCE
==================================================

The application must feel lightweight.

Avoid:
- unnecessary dependencies
- unnecessary re-renders
- massive component files
- duplicated business logic
- huge image assets
- blocking animations

Use:
- lazy loading where useful
- memoization only where justified
- efficient lists
- stable keys
- optimized state management

Keep animations short and purposeful.

==================================================
16. MOBILE POLISH
==================================================

Implement:
- safe-area handling
- keyboard-aware forms
- touch feedback
- disabled states
- loading states
- error states
- skeleton loaders
- empty states
- smooth scrolling
- pull-to-refresh where useful

Buttons should have obvious pressed feedback.

Forms should not feel like desktop forms placed inside a phone.

==================================================
17. ACCESSIBILITY
==================================================

Make sure:
- text has readable contrast
- buttons have accessible labels
- touch targets are comfortably sized
- important information isn't conveyed only through color
- error states are understandable

==================================================
18. CODE QUALITY
==================================================

Refactor toward:
- reusable components
- clear hooks
- clear services
- typed API responses
- typed domain models
- predictable state management

Do not create one giant App.tsx.

Suggested structure:

src/
  app/
  components/
  screens/
  features/
    billing/
    dashboard/
    orders/
    products/
    settings/
  services/
  api/
  storage/
  hooks/
  types/
  utils/

Keep frontend and backend responsibilities clearly separated.

==================================================
19. NO FAKE DATA POLICY
==================================================

This is mandatory.

Do NOT add:
- fake ₹28,450 revenue
- fake 142 orders
- fake "42 Cold Coffees sold"
- fake customer names
- fake order history
- fake printer connection
- fake sync success
- fake inventory values

Use actual data.

When there is no data:
- 0
- empty state
- skeleton
- "No data yet"

This project is intended to become a real paid product.

==================================================
20. DELIVERABLE
==================================================

After implementing Stage 1:

1. Make the app run locally.
2. Make sure the Vite build succeeds.
3. Ensure TypeScript has no avoidable errors.
4. Ensure the mobile layout works at ~360px, 390px, 412px and 430px widths.
5. Ensure navigation works.
6. Ensure billing/cart interactions work locally.
7. Ensure checkout success animation works.
8. Ensure no fake production data is shown.
9. Ensure environment variable usage is wired correctly.
10. Do not claim backend/printing is fully production-ready yet unless it is actually implemented and tested.

At the end, provide:
- what you changed
- files changed
- how to run the app
- how to run the Hono backend
- what remains for Stage 2

Do not stop at a visual mockup. Implement the working V1 foundation.