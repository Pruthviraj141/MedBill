STEP 4 — FRONTEND PERFORMANCE + API REQUEST OPTIMIZATION

The backend foundation is now stable and working correctly.

The application is functionally correct, but it still FEELS SLOW during normal use.

This step is specifically about finding why the React/Capacitor frontend feels slow.

DO NOT redesign the UI.
DO NOT change the visual design.
DO NOT change Billing layout/styling.
DO NOT redesign Dashboard.
DO NOT add large libraries.
DO NOT replace React Query.
DO NOT add Redux/Zustand unless the existing architecture genuinely requires it.
DO NOT change backend business logic unless the frontend audit proves a request is unnecessary.

GOAL:
Make the existing application feel immediate and responsive on a real Android/Capacitor device.

==================================================
1. TRACE EVERY API REQUEST
==================================================

Inspect the frontend API layer, React Query hooks, providers, route components and mutation logic.

Identify exactly what requests happen when:

A. App opens
B. Billing opens
C. Dashboard opens
D. Orders opens
E. Settings opens
F. Product/category filter changes
G. A product is added to cart
H. Quantity is changed
I. Bill Now is pressed
J. Checkout succeeds
K. A transaction is voided
L. Navigating between Billing / Dashboard / Orders

Create a factual table:

ACTION | API REQUESTS | REQUEST COUNT | UNNECESSARY REQUESTS

Do not guess.

==================================================
2. BILLING MUST FEEL INSTANT
==================================================

The Billing screen is the highest priority.

Product interactions must NOT call the backend.

Adding a product to cart:
→ local state only

Increasing/decreasing quantity:
→ local state only

Removing an item:
→ local state only

Changing category:
→ local filtering only

Searching:
→ local filtering only

Cart total calculation:
→ local calculation only

There must be NO API request for these interactions.

The backend should only be contacted when the user actually submits the bill.

==================================================
3. CHECKOUT REQUEST FLOW
==================================================

Trace exactly what happens after tapping:

"Bill Now"

Desired flow:

user taps Bill Now
→ submit exactly one order mutation
→ show appropriate loading state
→ receive successful order
→ show success UI
→ selectively update only data that actually changed

Do NOT trigger a chain like:

POST order
→ refetch products
→ refetch reports
→ refetch orders
→ refetch settings
→ refetch products again

Avoid unnecessary invalidation.

After checkout, only invalidate/refetch data that actually needs fresh information.

Products normally did not change, so DO NOT refetch products after every bill.

==================================================
4. REACT QUERY CACHE STRATEGY
==================================================

Inspect every query's:

- staleTime
- gcTime/cacheTime
- refetchOnMount
- refetchOnWindowFocus
- refetchOnReconnect
- enabled
- invalidation rules

Do NOT set everything to staleTime = 0.

Use sensible mobile-friendly caching.

Recommended principle:

PRODUCTS:
- cache for a reasonable period because products do not change on every bill

ORDERS:
- refresh when Orders screen actually needs current data
- do not repeatedly refetch while navigating unnecessarily

REPORTS:
- fetch when Dashboard becomes active or when its selected timeframe changes
- do not repeatedly refetch due to unrelated UI state changes

SETTINGS:
- cache normally
- do not repeatedly reload without cause

IMPORTANT:
Do not blindly use the exact numbers above.
Inspect the application first and choose values appropriate to the existing architecture.

==================================================
5. PREVENT COMPONENT-LEVEL REFETCH LOOPS
==================================================

Inspect useEffect/useQuery/useMutation logic for:

- dependencies causing repeated requests
- state changes causing query recreation
- query keys changing unnecessarily
- object literals being recreated inside query keys
- effects that run more often than intended
- route remounts causing repeated API calls
- duplicate hooks requesting the same data

Fix actual problems found.

Do not rewrite working components unnecessarily.

==================================================
6. PREVENT UNNECESSARY REACT RENDERS
==================================================

Profile or inspect the main screens:

- Billing
- Dashboard
- Orders

Look for:

- huge component trees rerendering after every cart change
- expensive calculations running on every render
- filtering/sorting products repeatedly
- chart data being recalculated unnecessarily
- unstable callbacks/objects causing child rerenders
- large lists rendering unnecessarily

Optimize only where there is a real benefit.

Use:
- useMemo where appropriate
- useCallback where appropriate
- React.memo where appropriate

Do NOT wrap everything in memoization.

==================================================
7. BILLING PRODUCT LIST
==================================================

The product grid must remain responsive even when the product list grows.

Inspect:
- image loading
- unnecessary image decoding
- repeated filtering
- repeated sorting
- unnecessary DOM nodes
- expensive animations

Do not add virtualization unless the actual product count justifies it.

Avoid:
- continuous Motion animations
- layout animations on every cart update
- expensive blur/shadow effects causing unnecessary repaint

Keep existing visual appearance unchanged.

==================================================
8. IMAGES / STATIC ASSETS
==================================================

Inspect product images and other frontend assets.

Check:
- image file sizes
- whether huge images are being loaded
- whether images are requested repeatedly
- whether native browser loading is appropriate

Use lazy loading where it helps.

Do NOT replace the current product image system unless necessary.

==================================================
9. NAVIGATION PERFORMANCE
==================================================

Check route/page mounting behavior.

When navigating:

Billing → Dashboard → Orders → Billing

avoid remounting and refetching everything unnecessarily.

Do not preload every screen's data simultaneously unless the current architecture proves that to be faster.

Load the data needed for the active screen.

==================================================
10. MOBILE / CAPACITOR PERFORMANCE
==================================================

This is an Android Capacitor app.

Check for:
- unnecessary DOM complexity
- expensive CSS
- heavy animations
- large JavaScript bundles
- unnecessary dependencies
- synchronous work during initial render
- repeated localStorage parsing
- expensive startup initialization

The app should become interactive quickly.

Do not add a complicated native architecture.

==================================================
11. STARTUP PERFORMANCE
==================================================

Inspect application initialization.

Find everything executed on startup:

- API requests
- auth restoration
- theme loading
- products loading
- settings loading
- dashboard loading
- route initialization

Avoid loading data for screens the user has not opened yet.

Billing is the primary screen.

Do NOT block the Billing UI waiting for Dashboard/Orders data.

==================================================
12. LOADING UX
==================================================

Do not solve slowness by simply adding spinners everywhere.

Use existing skeleton/loading patterns where appropriate.

The user should immediately see the app shell and useful cached/local data while fresh data is being fetched.

Do not fake data.

==================================================
13. MEASURE THE REAL FRONTEND
==================================================

Use browser/dev tooling where available and inspect:

- initial page load
- number of API requests
- duplicate requests
- largest requests
- slowest requests
- main-thread blocking work
- unnecessary rerenders

Measure before and after where possible.

Create a factual table:

FLOW | BEFORE REQUESTS | AFTER REQUESTS | CHANGE

At minimum measure:

1. App startup
2. Billing open
3. Add item to cart
4. Quantity change
5. Bill Now
6. Dashboard open
7. Orders open
8. Void order

DO NOT INVENT LATENCY NUMBERS.

==================================================
14. BACKEND MUST NOT BE RANDOMLY MODIFIED
==================================================

The backend is already cleaned and stable.

Only change a backend endpoint if the frontend audit proves:
- duplicate request
- unnecessary endpoint
- unnecessary response data
- incorrect request behavior

Do not redesign the backend again.

==================================================
15. REGRESSION TEST
==================================================

After optimization verify:

- Login
- Billing loads quickly
- Products appear correctly
- Search works
- Categories work
- Add to cart works
- Quantity changes are instant
- Bill Now works
- CASH works
- UPI works
- success screen works
- Orders works
- VOIDED orders work
- Dashboard works
- Settings works
- Light mode works
- Dark mode works

Most importantly:

Adding/removing/updating cart items must feel instantaneous and must NOT make API calls.

==================================================
FINAL REPORT
==================================================

Give me:

1. Exact source of slowness found
2. Requests before vs after
3. Duplicate requests removed
4. React rerenders reduced
5. Query cache changes
6. Startup work reduced
7. Asset/image improvements
8. Build/bundle findings
9. Actual measurements
10. Remaining bottleneck

Do not claim the app is faster unless you can support the claim with actual observation/measurement.

Do not change the UI design in this step.