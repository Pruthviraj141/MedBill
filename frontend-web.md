You are working inside an EXISTING production café POS project.

IMPORTANT:
Do NOT rebuild the backend.
Do NOT create new APIs.
Do NOT replace existing API calls.
Do NOT replace existing data-fetching logic.
Do NOT overwrite working business logic.
Do NOT redesign the existing bottom navigation.
Do NOT add navigation logic.
Do NOT change the existing navigation structure.

Your job is to FIRST UNDERSTAND the existing project completely, especially the current backend integration and existing dashboard/order APIs, and THEN improve the UI/UX so it matches the supplied reference images extremely closely.

REFERENCE IMAGES:
I am providing Light Mode Dashboard and Dark Mode Dashboard screenshots.
Treat these images as the PRIMARY visual reference.

==================================================
PHASE 1 — UNDERSTAND THE EXISTING IMPLEMENTATION
==================================================

Before modifying anything:

1. Inspect the complete frontend structure.
2. Inspect all existing Dashboard components.
3. Inspect all existing Orders components.
4. Inspect the existing API/service layer.
5. Inspect every API call currently used by Dashboard and Orders.
6. Inspect the response structures from those APIs.
7. Inspect all existing calculations and transformations.
8. Inspect existing state management.
9. Inspect existing date/time handling.
10. Inspect existing loading, error and empty states.
11. Inspect existing TypeScript types/interfaces.
12. Inspect existing utility functions.
13. Inspect existing chart/data processing logic.
14. Inspect how authentication/user information is already obtained.
15. Inspect how the currently selected period is handled: Today / Week / Month.
16. Inspect exactly how sales, orders, payment methods, peak hours and product statistics are calculated.

Do NOT assume how these calculations work.

For example, before touching the Peak Hour component, determine from the existing implementation:

- How hourly sales are obtained.
- How today's peak hour is calculated.
- How weekly peak hour is calculated.
- How monthly peak hour is calculated.
- Whether the backend returns already-aggregated values.
- Whether the frontend performs any aggregation.
- How zero-order hours are handled.
- How timezone/date boundaries are handled.

Do exactly the same investigation for:

- Today's Sales
- Orders count
- Average Bill
- Sales Activity
- Peak Hour
- Payment Mix
- Top Products
- Recent Orders
- Today's Insight
- Today / Week / Month filters

The existing backend and API behavior are the source of truth.

==================================================
PHASE 2 — DATA MUST REMAIN CORRECT
==================================================

This is extremely important.

The UI must NEVER use hardcoded dashboard values.

Do not create fake values such as:

₹1,660
5 orders
₹332 average bill
9 sold
₹1,530 revenue
etc.

Those values in the screenshots are visual examples only.

The actual application must use the existing backend/API data.

For every displayed value:

Dashboard → existing API/data source
Orders → existing API/data source
Top Products → existing API/data source
Recent Orders → existing API/data source
Payment Mix → existing API/data source
Peak Hour → existing API/data source

Do not change an existing calculation merely to make the screenshot look correct.

If the screenshot contains a value different from the live backend response, DISPLAY THE REAL BACKEND VALUE while preserving the same visual design.

==================================================
PHASE 3 — DASHBOARD UI
==================================================

Rebuild/refine ONLY the Dashboard presentation layer.

The visual target is the supplied reference image.

The Dashboard should have the same overall hierarchy, spacing, proportions, card structure, typography, alignment, rounded corners, shadows, icons and visual rhythm as the reference.

The design should feel like a premium modern café POS rather than a generic admin dashboard.

LIGHT MODE:
- Warm off-white / cream page background
- White cards
- Warm brown primary accent
- Subtle beige secondary surfaces
- Soft shadows
- Clean dark typography
- Very subtle borders
- Premium café aesthetic
- Minimal visual noise

DARK MODE:
- Deep near-black background
- Very dark charcoal/brown cards
- Warm brown accent
- Cream/off-white typography
- Muted secondary text
- Soft subtle borders
- Same layout and hierarchy as Light Mode
- Do NOT create a completely different design for dark mode

Both modes must feel like the SAME product.

==================================================
DASHBOARD HEADER
==================================================

Match the reference image closely.

Keep the existing application/header functionality.

The header should visually contain:

- TBT CAFE branding
- CAFÉ POS subtitle
- Welcome message
- Existing logged-in user information
- Existing online status
- Existing notification control
- Existing profile/avatar control
- Existing date selector if already implemented

Do not invent new backend behavior for any of these.

==================================================
TODAY'S SALES CARD
==================================================

Create the large hero sales card matching the reference.

It should visually contain:

- Today's Sales
- Actual sales amount from existing API
- Actual order count
- Actual average bill
- Existing comparison/percentage information if already supplied by backend
- Café/coffee visual treatment similar to the reference

The coffee illustration is purely visual.

Do not create business logic for this section.

Use existing data exactly.

==================================================
SALES ACTIVITY
==================================================

This section is very important.

Match the reference closely.

It should contain:

- Sales Activity title
- Today / Week / Month selector
- Existing sales chart data
- Proper X-axis labels
- Proper Y-axis scale
- Bars/visualization matching the reference
- Highlighted selected/important period where appropriate
- Tooltip interaction
- Smooth interaction

The chart must use the existing backend calculations.

DO NOT create a second calculation system.

When the user changes:

Today → use existing Today data
Week → use existing Week data
Month → use existing Month data

Do not fake chart values.

The chart should be responsive and readable on both:
- desktop
- mobile

==================================================
PEAK HOUR
==================================================

Match the reference Peak Hour card.

Display the actual peak hour calculated by the existing system.

Examples of visual format:

12 PM – 1 PM
18 orders

But these are examples only.

Use the actual backend result.

Also preserve the existing ability to switch between the relevant period if it already exists.

Do not introduce a new peak-hour calculation.

The mini visualization must correspond to the SAME underlying data.

A serious requirement:

The displayed peak hour, order count and chart must never contradict one another.

==================================================
PAYMENT MIX
==================================================

Match the reference Payment Mix card.

Display actual payment distribution from the existing API.

Examples shown in the reference include:

UPI
Cash

But if the backend already supports additional payment methods, preserve them rather than hiding them.

The donut chart percentages must exactly match the existing backend data.

The center total must match the relevant sales/payment total.

Do not hardcode percentages.

Ensure rounding does not produce visually inconsistent totals.

==================================================
TOP PRODUCTS
==================================================

This must remain completely dynamic.

Use the existing Top Products API/data.

Match the reference visual structure:

01
Product image
Product name
sold count
revenue

02
...

etc.

Requirements:

- Correct ranking
- Correct sold quantity
- Correct revenue
- Correct product names
- Existing product images where available
- Proper truncation
- No accidental text overlap
- Smooth scrolling/interaction if already supported
- View All should use existing routing/interaction

DO NOT independently recalculate product ranking unless the existing application already does so.

The ranking shown in the UI must correspond exactly to backend data.

==================================================
RECENT ORDERS
==================================================

Use the existing Recent Orders API/data.

Match the reference structure:

Order ID
Items
Amount
Time
Status

Example values in the screenshot are only visual examples.

Actual data MUST come from the current application.

Requirements:

- Correct order ID
- Correct number of items
- Correct amount
- Correct time
- Correct status
- Correct ordering
- Existing status logic must be preserved
- Proper handling of long IDs/product names
- No fake orders
- No hardcoded timestamps

The UI should feel very clean and compact while remaining readable.

==================================================
TODAY'S INSIGHT
==================================================

Preserve the existing insight/business logic.

Only improve its visual presentation to match the reference.

Do not invent a new "best-selling product" calculation.

If the current backend already determines the insight, use that result.

==================================================
BOTTOM NAVIGATION — DO NOT TOUCH
==================================================

This is a STRICT requirement.

The bottom navigation already exists.

It is already implemented.

Its design is already implemented.

Its routing/logic is already implemented.

DO NOT:

- recreate it
- redesign it
- move it
- replace it
- add new navigation logic
- change its existing routes
- change its visual behavior

The supplied screenshots show the desired placement and overall application context, but the existing bottom navigation implementation is the source of truth.

Leave it alone.

Only ensure the new Dashboard/Orders content does not overlap with it.

==================================================
RESPONSIVE BEHAVIOR
==================================================

The reference screenshots show the same design language across mobile and desktop.

Do NOT simply scale the desktop layout down.

Create proper responsive behavior.

Desktop:
- Spacious cards
- Wide analytics layout
- Two-column sections where appropriate
- Proper table layout

Mobile:
- Preserve the important information hierarchy
- Maintain the same design language
- Cards should reorganize naturally
- Avoid tiny unreadable charts
- Avoid horizontal overflow
- Preserve touch-friendly interactions
- Top Products and Recent Orders remain usable
- Existing bottom navigation remains untouched

==================================================
ORDERS PAGE
==================================================

Now apply the same design quality to the Orders page.

IMPORTANT:
The Orders page already has backend/API logic.

Do NOT create new backend calls.

First inspect:
- Existing order APIs
- Existing order models/types
- Existing status handling
- Existing filters
- Existing pagination
- Existing search
- Existing date handling
- Existing order details logic

Then improve ONLY the presentation and interaction quality.

The Orders page should feel like the same premium TBT CAFE POS product.

Suggested visual hierarchy based on the Dashboard language:

Header
↓
Orders title + supporting information
↓
Search / existing filters
↓
Order list/table
↓
Order details interaction
↓
Existing pagination/load-more behavior

Every order must show the real backend data.

Do not replace existing functionality.

==================================================
ORDER DETAILS
==================================================

If an order detail view/modal/drawer already exists:

KEEP ITS EXISTING LOGIC.

Refine its UI.

It should clearly show:

- Order ID
- Date/time
- Items
- Quantity
- Item prices
- Subtotal
- Taxes/fees if backend provides them
- Discount if backend provides it
- Final total
- Payment method
- Order status
- Existing customer information where available

Everything must come from existing data.

Do not invent fields that the backend doesn't provide.

==================================================
INTERACTION QUALITY
==================================================

The interface should feel extremely smooth.

Use subtle transitions for:

- cards
- tabs
- chart interactions
- hover states
- buttons
- order rows
- modals/drawers

But avoid excessive animation.

This is a café POS, not a gaming dashboard.

Prioritize:
- speed
- clarity
- readability
- touch usability
- predictable interaction

==================================================
VERY IMPORTANT IMPLEMENTATION RULE
==================================================

Before changing code, inspect the existing implementation and make a plan.

Then modify the smallest necessary set of files.

Do NOT perform a wholesale rewrite.

Do NOT replace working components just because another implementation looks cleaner.

Do NOT create duplicate API services.

Do NOT create duplicate hooks.

Do NOT create duplicate calculations.

Do NOT create mock data.

Do NOT remove existing functionality.

Do NOT silently change backend contracts.

Do NOT change API response structures.

Do NOT change database logic.

Do NOT change authentication.

Do NOT change navigation.

Do NOT break existing routes.

==================================================
REFERENCE IMAGE MATCHING
==================================================

The supplied images are visual references.

The final Dashboard should visually follow them as closely as practical:

- Same overall structure
- Same information hierarchy
- Similar card dimensions
- Similar spacing
- Similar typography hierarchy
- Similar icon placement
- Similar chart positioning
- Similar alignment
- Similar rounded corners
- Similar warm café color system
- Similar light/dark treatment
- Similar bottom navigation context

Do not "reinterpret" the design into another dashboard style.

Do not simplify it into a generic admin panel.

Do not add unrelated widgets.

Do not remove the important widgets shown in the reference.

==================================================
DATA / VISUAL CONSISTENCY CHECK
==================================================

Before declaring the work complete, verify:

1. Dashboard values come from existing APIs.
2. Top Products matches backend results.
3. Recent Orders matches backend results.
4. Payment percentages match backend data.
5. Peak Hour matches backend data.
6. Sales chart matches existing calculations.
7. Today/Week/Month changes the correct existing dataset.
8. No value is hardcoded.
9. No API was unnecessarily duplicated.
10. No backend logic was changed.
11. Existing navigation still works exactly as before.
12. Existing routes still work.
13. No horizontal overflow exists.
14. Mobile layout remains usable.
15. Desktop layout matches the supplied image closely.
16. Light mode matches the supplied Light reference.
17. Dark mode matches the supplied Dark reference.
18. Loading/error/empty states still work.
19. Existing order functionality still works.
20. Existing order detail behavior still works.

==================================================
FINAL REQUIREMENT
==================================================

FIRST understand.
THEN plan.
THEN implement.

Do not start by blindly replacing the Dashboard.

The existing backend and existing API integration are valuable and already built.

The goal is:

EXISTING BUSINESS LOGIC
+
EXISTING API DATA
+
EXISTING NAVIGATION
+
NEW REFINED UI/UX

NOT:

NEW BACKEND
+
NEW API
+
NEW BUSINESS LOGIC.

The final result should look like the supplied reference images while remaining 100% connected to the existing application's real data and functionality.