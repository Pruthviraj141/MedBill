MASTER UI REBUILD — TBT CAFE MOBILE POS
=======================================

IMPORTANT:
DO NOT DISCUSS. IMPLEMENT.

Use the attached screenshots as the CURRENT broken UI reference.
Use the attached TBT CAFE logo as the ONLY brand/logo source.

The current app is NOT acceptable:
- too small on phone
- weak spacing
- poor alignment
- flat/boring cards
- desktop-like composition
- weak typography
- dashboard has large empty areas
- billing feels cramped
- dark mode is not a real dark theme
- visual hierarchy is poor
- interactions feel slow

Rebuild the FRONTEND UI/UX, keeping all existing working backend/API/business logic.

==================================================
CORE RULE
==================================================

This is an ANDROID-FIRST MOBILE POS.

Design target:
360–430px portrait.

DO NOT design desktop first.
DO NOT squeeze desktop layouts into mobile.

The app should feel like a polished native Android POS running inside Capacitor.

Priorities:

1. Billing speed
2. Touch UX
3. Visual hierarchy
4. Readability
5. Smoothness
6. Premium branding
7. Simplicity

==================================================
USE THE INSTALLED COMPONENT SYSTEM
==================================================

Use the EXISTING installed shadcn/ui components.

Inspect the project first and actually USE the installed components.

Use where appropriate:

Button
Input
Card
Badge
Avatar
ScrollArea
Tabs
ToggleGroup
Sheet
Dialog
Command
Skeleton
Separator
Toast
Tooltip

Use 21st.dev ONLY for selected mobile component patterns such as:
- mobile navigation
- search
- compact cards
- mobile lists
- analytics patterns

Do NOT invent a separate component system.

Do NOT install another UI framework.

Use Motion only for lightweight interaction animation.

==================================================
DESIGN SYSTEM
==================================================

Create ONE coherent TBT design system.

Brand:
TBT CAFE logo
coffee-inspired premium palette

Light:
warm off-white / cream background
dark brown primary
subtle bronze/gold accent

Dark:
deep charcoal background
warm cream text
brown/bronze elevated surfaces
same brand colors

Light and dark mode must look like the SAME APP.

Theme is controlled from Settings and persisted.

DO NOT put a theme switch on Billing.

==================================================
BILLING SCREEN — MAIN SCREEN
==================================================

Billing is the PRIMARY SCREEN.

Structure MUST be:

HEADER
TBT CAFE logo
TBT CAFE
CAFÉ POS
Online status
Profile

SEARCH
large full-width search input
search icon
optional scan icon

CATEGORY ROW
All
Recent
Pizza
Sandwich
Burger
Pasta
etc. from real product categories

IMPORTANT:
Recent is a FILTER beside All.
DO NOT create a separate Recent section above categories.

MENU
3-column product grid when width permits.

Product card:
image
name
price
circular + button

Cards must be:
larger
clean
aligned
touch-friendly
consistent height
consistent image ratio

Tap product:
instant cart update
subtle Motion feedback
NO visible lag

BOTTOM CART BAR
cart icon
item count
total
"Bill Now"

Do NOT use "View Cart".

BOTTOM NAV:
Billing
Dashboard
Orders
Settings

NO Products tab.

==================================================
BILLING UX
==================================================

Cashier workflow:

open Billing
→ search/category
→ tap products
→ Bill Now
→ payment
→ success

Minimize taps.

No unnecessary dialogs.

Use Sheet only where it improves the mobile flow.

==================================================
CHECKOUT
==================================================

Payment screen must be clean.

Large total.
Payment choices:
Cash
UPI
Card

Final action:
Pay / Complete Bill

Prevent double submit.

==================================================
SUCCESS ANIMATION
==================================================

After REAL successful order:

animated circle
animated checkmark
"Payment successful"
amount
payment method
invoice number

Primary:
New Bill

Secondary:
View Order

Use Motion.

Animation must be quick and lightweight.

Never show success if the API failed.

==================================================
DASHBOARD
==================================================

The CURRENT dashboard is badly composed.

REMOVE:

Good evening / personal greeting
large hero copy
marketing slogans
fake percentage growth
fake promotional cards
large empty areas

Dashboard should immediately present REAL BUSINESS DATA.

TOP:
TBT CAFE branding
Online status
Today / Week / Month / Custom

PRIMARY:
Today's Sales
real revenue

Secondary:
Orders
Average Bill

Then compact analytics:

Sales Activity
Peak Hour
Top Products
Payment Mix
Recent Orders

Everything must use REAL API data.

No fake numbers.

If empty:
clean empty state.

Charts must be compact and mobile readable.

Do not create huge desktop chart panels.

==================================================
ORDERS
==================================================

Orders screen:

Today
Yesterday
Earlier

Each row/card:
invoice number
time
items
amount
payment method
status

Tap:
order details

Keep it fast and searchable.

==================================================
SETTINGS
==================================================

Keep Settings simple.

Sections:

Theme
Light / Dark / System

Business
Cafe information
Tax/GST
Invoice

Printer
Printer settings

Transactions
Manage/void transactions

System
Sync status
About

Do NOT add unnecessary enterprise settings.

==================================================
MOBILE SPACING / ALIGNMENT
==================================================

This is CRITICAL.

Use one consistent horizontal page padding.

Use a consistent spacing scale.

All cards and controls must align to the same left/right edges.

Avoid random margins.

No clipped text.

No overlapping fixed elements.

No giant empty gaps.

No microscopic text.

Touch targets must be comfortable.

Bottom cart must never overlap bottom navigation.

Use safe-area insets for Capacitor.

==================================================
PERFORMANCE
==================================================

The CURRENT app feels slow.

Fix actual rendering/performance problems.

Inspect:
- unnecessary renders
- repeated API calls
- expensive calculations
- large DOM
- chart re-renders
- unstable props
- excessive effects
- animation cost

Use:
React.memo where justified
memoization where justified
debounced search
cached API data
efficient rendering

DO NOT add heavy visual effects.

DO NOT use:
3D
shaders
particles
continuous animations
large blur effects
unnecessary parallax

Billing must remain responsive even when dashboard data is loading.

==================================================
REAL DATA ONLY
==================================================

Never invent:
products
revenue
orders
customers
inventory
analytics
payment percentages
printer states

Use existing real API/data sources.

No demo content.

==================================================
IMPORTANT COMPONENT RULE
==================================================

Before creating custom UI, check whether the installed shadcn component already solves it.

Prefer:

shadcn primitives
+
selected 21st.dev patterns
+
Motion

Do not add another component library.

==================================================
VISUAL QA
==================================================

After implementation, compare directly against the attached screenshots.

Fix:
spacing
alignment
card proportions
font sizes
search position
category spacing
product card size
cart placement
bottom navigation
dashboard composition

The current screenshots are NOT the design target.
They are the PROBLEM to fix.

==================================================
FINAL FEEL
==================================================

The final app should feel:

TBT CAFE
premium
simple
fast
professional
mobile-first
touch-friendly
modern
data-driven

It must feel like a REAL Android POS,
not a website wrapped inside an APK.

Do not change backend logic.
Do not add unnecessary features.
Do not replace real data with mocks.

Implement the UI, then run the app and verify the mobile layout before finishing.