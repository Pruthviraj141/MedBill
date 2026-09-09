Continue from the existing café POS project. Do NOT rebuild from scratch.

Goal: turn the V1 foundation into a REAL working billing system backed by Hono + MongoDB Atlas, while preserving the existing premium mobile UI.

==================================================
1. CONNECT THE REAL BACKEND
==================================================

Implement the Hono backend completely.

Architecture:

React/Vite + Capacitor
        ↓
API service
        ↓
Hono / Cloudflare Workers
        ↓
MongoDB Atlas

Never expose MongoDB credentials to the frontend.

Use environment variables and secure backend secrets.

Required environment variables:

MONGODB_URI=
MONGODB_DB_NAME=
AUTH_SECRET=
WEB_ORIGIN=
VITE_API_BASE_URL=

Create a safe `.env.example`.

Never commit `.env`.

==================================================
2. MONGODB DATA MODEL
==================================================

Implement these collections:

cafes
users
categories
products
customers
orders
payments
inventory
inventory_movements
audit_logs

Every relevant record must contain:
- cafeId
- createdAt
- updatedAt

Create proper indexes for:
- cafeId
- createdAt
- invoiceNumber
- productId
- status
- paymentMethod

==================================================
3. AUTHENTICATION
==================================================

Implement real authentication.

Login:
POST /api/auth/login

Return a secure authenticated session/token.

Protect private routes with middleware.

Roles:
- OWNER
- MANAGER
- CASHIER

Permission examples:

OWNER:
full access

MANAGER:
products, inventory, reports, orders

CASHIER:
billing, orders

Never trust role information sent directly by the client.

==================================================
4. PRODUCTS
==================================================

Implement real CRUD:

GET    /api/products
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id

Fields:
- name
- categoryId
- price
- active
- stockTracking
- imageUrl optional

Validate all input.

No fake products should be created automatically.

==================================================
5. ORDERS / BILLING
==================================================

Implement:

POST /api/orders
GET /api/orders
GET /api/orders/:id

Order should contain:
- cafeId
- invoiceNumber
- deviceId
- cashierId
- items
- subtotal
- discount
- tax
- grandTotal
- paymentMethod
- status
- createdAt

CRITICAL:
Store product name and price snapshot inside each order item.

Example:

items: [
  {
    productId,
    name,
    unitPrice,
    quantity,
    total
  }
]

This protects historical invoices when product prices later change.

==================================================
6. SERVER-SIDE BILL VALIDATION
==================================================

Do NOT trust totals coming from React.

When an order arrives:

1. Validate authentication.
2. Validate cafe access.
3. Load products from MongoDB.
4. Verify products are active.
5. Verify prices.
6. Recalculate subtotal.
7. Recalculate tax.
8. Apply valid discount rules.
9. Calculate grandTotal.
10. Save the order.
11. Create payment record.
12. Update inventory where applicable.
13. Create audit log when required.

The server should be the authority for the final bill amount.

==================================================
7. PAYMENT RECORD
==================================================

Implement payment data:

- orderId
- cafeId
- amount
- method
- status
- createdAt

Methods:
- CASH
- UPI
- CARD
- OTHER

Do NOT implement fake online UPI/card gateway integration yet.

Record selected payment method correctly.

==================================================
8. INVOICE NUMBERING
==================================================

Implement reliable invoice numbering.

Do not use only the frontend timestamp.

The invoice number must be unique within the café.

Support:
- multiple devices
- offline-created orders later synchronized

Design the numbering system so duplicate invoice numbers cannot occur.

==================================================
9. REAL DASHBOARD DATA
==================================================

Replace any remaining hardcoded dashboard statistics.

Create:

GET /api/reports/today
GET /api/reports/week
GET /api/reports/month

Dashboard must show actual MongoDB results.

Metrics:
- revenue
- number of orders
- average bill
- peak ordering hour
- top-selling products
- payment breakdown
- recent orders

Use MongoDB aggregation pipelines.

Do NOT store fake analytics.

If there is no data:
show 0 / empty state.

==================================================
10. BILLING UI → REAL API
==================================================

Connect the billing screen to the API.

Product list:
API → real products

Checkout:
React
 ↓
POST /api/orders
 ↓
Hono
 ↓
MongoDB
 ↓
success response

Show:
- loading state
- validation errors
- network errors
- success state

Never pretend an order succeeded if the API failed.

==================================================
11. REAL ORDER SUCCESS EXPERIENCE
==================================================

After a successful payment/order:

Show a polished mobile success animation:

1. subtle screen transition
2. animated circular success icon
3. checkmark draw animation
4. "Payment successful"
5. invoice number
6. amount
7. payment method
8. print status

Primary button:
NEW BILL

Secondary:
VIEW ORDER

Animation should be smooth and short.

No excessive effects.

==================================================
12. LOCAL DATA FOUNDATION
==================================================

Keep the existing SQLite/local-storage architecture clean.

Prepare the app for:

local order
→ pending sync
→ synced

Do not create a fake cloud sync success.

The system should clearly distinguish:
- local only
- syncing
- synced
- failed

==================================================
13. ERROR HANDLING
==================================================

Implement a consistent API response format.

Example:

{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  }
}

Frontend should convert backend errors into useful human-readable messages.

Avoid generic:
"Something went wrong"

when a specific message is available.

==================================================
14. AUDIT LOGGING
==================================================

Log important actions:

- login
- product created
- product price changed
- product deleted/deactivated
- order created
- order cancelled
- inventory adjustment
- user changes

Include:
- userId
- cafeId
- action
- entityType
- entityId
- timestamp

==================================================
15. SECURITY
==================================================

Implement:
- request validation
- authentication middleware
- authorization
- MongoDB credential protection
- safe error messages
- input sanitization
- no secrets in frontend
- no sensitive debug output in production

Never trust:
- cafeId from client
- userId from client
- role from client
- totals from client

Derive trusted identity from authentication.

==================================================
16. PERFORMANCE
==================================================

Keep the mobile application fast.

- debounce product search
- avoid repeated API requests
- cache product data appropriately
- paginate large order lists
- avoid loading entire order history at once
- use efficient MongoDB indexes

==================================================
17. TESTING
==================================================

Create basic tests or verification for:

- login
- product creation
- product retrieval
- order creation
- invalid order
- payment recording
- report calculation
- permission checks

Test these scenarios:

A. valid online order
B. invalid product
C. unauthorized cashier action
D. zero-data dashboard
E. multiple orders on same day

==================================================
18. FINAL REQUIREMENT
==================================================

Do not add fake data.

Do not fake successful API calls.

Do not fake analytics.

Do not fake payment completion.

The app should now be genuinely connected to MongoDB through Hono.

At the end:
- run the frontend build
- run backend checks
- fix TypeScript errors
- fix obvious runtime errors
- document required environment variables
- clearly report anything that cannot yet work without Stage 3 hardware/offline implementation

Keep the existing premium mobile design intact.
Prioritize reliability and correctness over adding more screens.