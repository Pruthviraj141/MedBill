You are working inside the existing TBT Cafe POS repository.

OBJECTIVE
Implement reliable thermal receipt printing for the existing EZO Chota/Bada 58mm thermal billing machine on BOTH:
1. Android APK (React + Vite + Capacitor)
2. Desktop/PC web application via USB

The application is already working correctly. This is an integration task, NOT a rewrite.

==================================================
PHASE 0 — MANDATORY REPOSITORY AUDIT
==================================================

Before modifying ANY file:

1. Inspect the complete repository structure.
2. Identify the exact frontend structure.
3. Identify the Capacitor Android project.
4. Identify the existing SQLite/offline-first implementation.
5. Identify the existing order creation and checkout flow.
6. Identify all existing API clients/services/hooks.
7. Identify the existing sync/background synchronization logic.
8. Identify existing receipt/invoice/order components.
9. Search the repository for:
   - printer
   - printing
   - receipt
   - invoice
   - Bluetooth
   - USB
   - RawBT
   - Capacitor
   - SQLite
   - sync
   - qr.jpg
10. Locate the EXISTING qr.jpg and use its real repository path.
11. Inspect package.json and existing dependencies before adding anything.
12. Do not create new backend APIs unless absolutely unavoidable.
13. Do not assume file paths, APIs, database fields, or existing architecture.

Do not begin implementation until this audit is complete.

==================================================
PHASE 1 — PRESERVE EVERYTHING THAT ALREADY WORKS
==================================================

The following must remain unchanged unless a change is strictly required
for printer integration:

- Existing Hono backend
- Existing API endpoints
- Existing API request/response contracts
- Existing database schema
- Existing order creation logic
- Existing billing calculations
- Existing GST/tax calculations
- Existing payment logic
- Existing SQLite/offline transaction logic
- Existing sync logic
- Existing dashboard
- Existing Orders page
- Existing Billing UI
- Existing Android UI/layout
- Existing authentication
- Existing QR/business logic
- Existing data fetching

DO NOT rewrite working systems.

Printing must be added as an isolated layer on top of the existing order flow.

==================================================
PHASE 2 — SHARED RECEIPT ARCHITECTURE
==================================================

Create a reusable receipt-printing layer.

Architecture:

Existing Order
    ↓
ReceiptDocument
    ↓
58mm Receipt Formatter
    ↓
ESC/POS Encoder
    ↓
Platform Printer Adapter
    ├── Android → Bluetooth/RawBT path
    └── PC → Local USB Print Agent
    ↓
EZO 58mm Thermal Printer

The receipt content must come from the EXISTING order/billing data.

Do NOT introduce duplicate billing logic.

ReceiptDocument should represent existing information such as:

- Café/business name
- Existing café details
- Order/invoice number
- Existing date/time
- Existing items
- Existing quantity
- Existing item price
- Existing subtotal
- Existing discount
- Existing GST/tax values
- Existing final total
- Existing payment method
- Existing QR/payment information where applicable

Never invent fake order data.

==================================================
PHASE 3 — 58MM PRINTER PROFILE
==================================================

Target the EZO Chota/Bada 58mm thermal printer.

Paper:
58mm thermal roll

Treat 58mm as the printer target, but do NOT blindly assume the exact
printable width or character count.

Create a configurable printer profile.

Example concepts:

- paperWidthMm: 58
- printableWidth / columns: configurable
- character encoding: configurable
- image width: configurable
- QR size: configurable

Keep printer-specific measurements isolated in the printer profile.

Do not scatter 58mm-specific magic numbers throughout the application.

==================================================
PHASE 4 — RECEIPT DESIGN
==================================================

Create a clean professional thermal receipt suitable for a real café.

Structure:

                    TBT CAFE
                 existing details

--------------------------------
Invoice: #XXXX
Date: DD/MM/YYYY
Time: HH:MM
--------------------------------

ITEM              QTY       AMT
--------------------------------
Item name           2      ₹XXX
Long item name      1      ₹XXX
--------------------------------

Subtotal                  ₹XXX
Discount                   ₹XXX
GST                        ₹XXX
--------------------------------
TOTAL                     ₹XXX
--------------------------------

Payment: UPI/CASH

             [QR]

          Thank You!
          Visit Again

The exact values must come from the existing system.

Requirements:

- correct alignment
- no text overflow
- long product names must wrap safely
- quantity column must remain aligned
- amount column must remain aligned
- totals must remain aligned
- clean separators
- proper monetary formatting
- optimized for 58mm
- minimal unnecessary graphics
- fast printing

Do not make the receipt dependent on Light/Dark UI mode.
The physical receipt is always printer-friendly black/white output.

==================================================
PHASE 5 — EXISTING qr.jpg
==================================================

There is ALREADY an asset named:

qr.jpg

This file must be reused.

First locate its EXACT path in the repository.

DO NOT:

- generate a replacement QR
- create another QR image
- delete qr.jpg
- rename qr.jpg unnecessarily
- invent a path
- replace the existing QR backend logic
- use fake QR data

Use the existing qr.jpg.

Printing pipeline:

qr.jpg
  ↓
load existing asset
  ↓
resize to appropriate 58mm print width
  ↓
convert to printer-compatible monochrome bitmap
  ↓
ESC/POS image command
  ↓
thermal printer

The printed QR must remain properly scannable.

Do not simply assume a browser-rendered JPG can be sent directly to
the thermal printer.

==================================================
PHASE 6 — ANDROID IMPLEMENTATION
==================================================

Existing platform:

React + Vite + Capacitor Android.

Required flow:

Existing checkout
    ↓
Existing local SQLite transaction succeeds
    ↓
Create print job
    ↓
ReceiptDocument
    ↓
58mm formatter
    ↓
ESC/POS encoder
    ↓
Android transport
    ↓
Bluetooth
    ↓
EZO printer

The supplied project research identifies RawBT as the intended Android
print-service approach.

First inspect the repository and existing Android setup.

If RawBT is compatible with the existing implementation, use it rather
than introducing unnecessary native Bluetooth complexity.

Do not add a heavy native dependency simply because it is available.

If RawBT is used, keep the integration isolated inside the printer layer.

Do not spread RawBT-specific code across UI components.

==================================================
PHASE 7 — DESKTOP / PC IMPLEMENTATION
==================================================

For the desktop web application, the target is USB-connected EZO printer.

Preferred architecture:

React Web App
    ↓
Local Print Agent on the PC
    ↓
USB
    ↓
EZO 58mm Printer

The Print Agent should be a small isolated local service/application.

The browser should send a print request to localhost.

Example conceptual interface:

POST http://127.0.0.1:<configured-port>/print

Do NOT hard-code this exact port unless it fits the existing repository.

The print agent should:

1. Receive print data.
2. Validate the print request.
3. Generate/use ESC/POS bytes.
4. Send to the configured USB printer.
5. Return success/failure.
6. Never alter order/database state.

Browser window.print() may remain only as a fallback if necessary.
It must NOT become the primary POS printing mechanism if a reliable
local print agent can be implemented.

==================================================
PHASE 8 — SHARED PRINTER ABSTRACTION
==================================================

Keep printer-specific logic isolated.

Create a small abstraction conceptually similar to:

- connect()
- disconnect()
- print()
- testPrint()
- getStatus()

Android and PC should implement platform-specific adapters.

Example:

ReceiptDocument
    ↓
PrinterService
    ├── AndroidPrinterAdapter
    └── DesktopPrinterAdapter

Do not place raw printer commands directly inside:
- checkout components
- order components
- dashboard
- API client
- database code

==================================================
PHASE 9 — OFFLINE-FIRST BEHAVIOUR
==================================================

THIS IS CRITICAL.

The current application is offline-first.

Correct sequence:

Existing local SQLite transaction succeeds
    ↓
Bill/order is successfully created locally
    ↓
Print job is created
    ↓
Printer attempts immediately
    ↓
Cloud sync continues independently

NEVER wait for Cloudflare/backend synchronization before printing.

NEVER make internet connectivity a requirement for printing.

The existing local transaction remains the source of truth for immediate
printing.

==================================================
PHASE 10 — PRINT QUEUE / RELIABILITY
==================================================

Printing failure must NEVER corrupt or duplicate an order.

Use an isolated print-job state such as:

PENDING
PRINTING
PRINTED
FAILED

Example:

Order saved       ✓
Payment saved     ✓
Printer offline   ⚠
Print job FAILED

The user should be able to retry printing without recreating the order.

Never create a second order just because printing failed.

Never rollback a successful order because printing failed.

If the project already has a suitable local storage/queue mechanism,
reuse it rather than adding a duplicate persistence system.

==================================================
PHASE 11 — PRINTER TEST MODE
==================================================

Add printer testing without changing existing application workflows.

Provide a safe test-print action in the existing appropriate settings/
printer area.

Test receipt must verify:

- 58mm formatting
- text
- bold
- alignment
- columns
- quantities
- amounts
- ₹/currency rendering where supported
- long product names
- subtotal
- tax
- total
- payment method
- existing qr.jpg
- image rendering
- paper feed

Do not claim the printer is supported merely because the code compiles.

==================================================
PHASE 12 — DEPENDENCY DISCIPLINE
==================================================

Before installing anything:

1. Check current dependencies.
2. Reuse existing packages when possible.
3. Add only necessary dependencies.
4. Avoid large printer libraries when unnecessary.
5. Do not change package versions unrelated to printing.
6. Do not upgrade the entire project just to implement printing.

==================================================
PHASE 13 — VALIDATION
==================================================

After implementation:

1. Run the existing frontend build.
2. Run TypeScript checks.
3. Validate the Android build.
4. Validate the desktop web build.
5. Test existing order creation.
6. Test existing offline behaviour.
7. Test existing synchronization.
8. Test printer connection.
9. Test actual 58mm receipt output.
10. Test qr.jpg printing.
11. Test QR scanning from the physical receipt.
12. Test disconnected printer.
13. Test print retry.
14. Ensure no duplicate orders.
15. Ensure no changed API contracts.
16. Ensure unrelated pages/features are untouched.

If an implementation requires changing existing business logic,
STOP and reassess before doing so.

==================================================
FINAL REQUIREMENT
==================================================

Make the smallest, safest, production-quality printer integration possible.

The existing TBT Cafe POS is already functioning correctly.
The goal is to ADD reliable printing, not rebuild the application.

Prioritize:
- correctness
- offline reliability
- 58mm physical output
- existing qr.jpg
- Android Bluetooth
- PC USB
- minimal backend impact
- isolated printer code
- easy future printer replacement
- no regression in existing functionality