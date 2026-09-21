MASTER IMPLEMENTATION PROMPT — TBT CAFE POS THERMAL PRINTER

You are implementing thermal printing for the EXISTING TBT Cafe POS repository.

IMPORTANT: This is an integration task, NOT a rewrite.

The POS is already working correctly. The backend, APIs, SQLite/offline-first flow, order creation, billing calculations, synchronization, Android UI, desktop UI, Dashboard, Orders, Billing, authentication, and existing QR/business logic must be preserved.

Your job is ONLY to add a reliable printer layer for the EZO Chota/Bada 58mm thermal printer on:

1. Android APK — React + Vite + Capacitor
2. Desktop/PC — Web application + USB printer

============================================================
PHASE 0 — READ-ONLY AUDIT BEFORE ANY CODE
============================================================

Before editing ANY file:

1. Inspect the complete repository structure.
2. Identify the exact frontend root.
3. Identify the Capacitor Android project.
4. Identify the existing SQLite/offline implementation.
5. Identify checkoutService, ordersRepository, or their actual equivalents.
6. Identify the existing order creation flow.
7. Identify payment and billing calculation logic.
8. Identify existing API clients/services/hooks.
9. Identify the existing background/cloud sync logic.
10. Identify existing receipt/invoice/order components.
11. Search the repository for:
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
12. Locate the EXACT real repository path of qr.jpg.
13. Inspect package.json and all existing relevant dependencies.
14. Inspect any existing printer or hardware implementation before creating another.
15. Determine whether the repository already contains a suitable local-service/native integration.

Do NOT modify files during this audit.

Do NOT guess file paths.
Do NOT guess APIs.
Do NOT invent database fields.
Do NOT invent printer capabilities.

Only after understanding the existing implementation should you proceed.

============================================================
PHASE 1 — HARD SCOPE BOUNDARY
============================================================

DO NOT rewrite or unnecessarily modify:

- Hono backend
- Existing API routes
- Existing API contracts
- Database schema
- Existing order creation
- Existing billing calculations
- Existing GST/tax calculations
- Existing payment logic
- Existing SQLite/offline transactions
- Existing sync implementation
- Dashboard
- Orders page
- Billing UI
- Settings UI unrelated to printing
- Existing Android UI/layout
- Existing desktop UI/layout
- Existing authentication
- Existing QR/business logic

Printing must sit ON TOP of the existing system.

If an existing working function already provides data needed by printing,
reuse it.

Do not duplicate business logic.

============================================================
PHASE 2 — SHARED RECEIPT PIPELINE
============================================================

Build one shared receipt pipeline:

Existing Order
    ↓
ReceiptDocument
    ↓
58mm Receipt Formatter
    ↓
ESC/POS Encoder
    ↓
Platform Printer Adapter
    ├── Android → Bluetooth/RawBT
    └── PC → Local USB Print Agent
    ↓
EZO 58mm Printer

There must be ONE source of truth for receipt content.

ReceiptDocument must be mapped from the EXISTING order/billing objects.

Reuse actual existing fields for:

- café/business name
- café details
- invoice/order number
- date
- time
- items
- item names
- quantity
- price
- subtotal
- discount
- GST/tax
- total
- payment method
- existing payment/QR information

Never generate fake/mock order data.

Never duplicate billing calculations inside the printer layer.

============================================================
PHASE 3 — 58MM PRINTER PROFILE
============================================================

Target the EZO Chota/Bada 58mm thermal printer.

Paper target:
58mm thermal roll.

Do NOT assume that one hard-coded value works for every ESC/POS mode.

Create a configurable printer profile containing values such as:

- paperWidthMm = 58
- printableColumns
- imageWidthPx
- qrSize
- text encoding/code page
- autoCut
- feedLines

Use sensible initial values based on the repository/research, but keep
them configurable and verify against the physical printer.

Do NOT permanently hard-code "32 columns" as a universal rule.

Do NOT permanently hard-code "384px" as a universal rule.

Treat both as configurable printer-profile values.

============================================================
PHASE 4 — RECEIPT DESIGN
============================================================

Create a professional, highly readable 58mm thermal receipt.

Target structure:

                    TBT CAFE
                 existing details

--------------------------------
Invoice: #XXXX
Date: DD/MM/YYYY
Time: HH:MM
--------------------------------

ITEM              QTY       AMT
--------------------------------
Item Name           2      ₹XXX
Long Item Name      1      ₹XXX
--------------------------------

Subtotal                  ₹XXX
Discount                   ₹XXX
GST                        ₹XXX
--------------------------------
TOTAL                     ₹XXX
--------------------------------

Payment: UPI/CASH

             [ QR ]

          Thank You!
          Visit Again

Requirements:

- correct alignment
- no overflow
- long product names wrap safely
- quantity column remains aligned
- amount column remains aligned
- totals remain aligned
- consistent spacing
- clean separators
- correct monetary formatting
- fast printing
- optimized specifically for 58mm
- black/white printer-friendly output
- no dependency on Light/Dark application theme

The physical receipt must remain visually consistent whether the POS
is currently in Light Mode or Dark Mode.

============================================================
PHASE 5 — EXISTING qr.jpg
============================================================

There is ALREADY a repository asset named:

qr.jpg

FIRST locate its exact path.

Then reuse THAT file.

DO NOT:

- create another QR
- generate a fake QR
- replace qr.jpg
- rename qr.jpg unnecessarily
- move qr.jpg unnecessarily
- guess its path
- replace existing QR/payment logic
- replace it with a newly generated QR

Required pipeline:

qr.jpg
    ↓
load local asset
    ↓
validate image
    ↓
resize to printer profile width
    ↓
convert to printer-compatible monochrome bitmap
    ↓
preserve sufficient white quiet-zone/margin
    ↓
place centered on receipt
    ↓
encode as ESC/POS image data
    ↓
print

The physical printed QR MUST remain scannable.

Do not simply inject browser HTML/CSS image rendering into the thermal
printer stream.

Add automated/basic validation for:

- file exists
- image can be loaded
- image conversion succeeds
- output dimensions are valid
- bitmap generation succeeds

Final verification MUST include scanning the actual printed QR.

============================================================
PHASE 6 — TEXT ENCODING
============================================================

Do NOT assume arbitrary Unicode will print correctly.

Make text encoding/code-page handling explicit and configurable.

Test:

- normal English
- numbers
- currency symbol ₹
- punctuation
- long product names

Also test Devanagari text if the existing café requirements use
Marathi/Hindi.

If the printer cannot reliably render required Unicode through its
native code page, use a controlled raster-text fallback for affected
Unicode text rather than corrupting the entire receipt.

Do not silently claim Unicode support without testing it.

============================================================
PHASE 7 — ANDROID PRINTING
============================================================

Existing platform:
React + Vite + Capacitor Android.

Required flow:

Existing checkout
    ↓
Existing local SQLite transaction succeeds
    ↓
Create print job
    ↓
Build ReceiptDocument
    ↓
58mm formatter
    ↓
ESC/POS encoder
    ↓
Android printer transport
    ↓
Bluetooth
    ↓
EZO printer

The supplied hardware research identifies RawBT as the intended
Android print-service approach.

First inspect the current Android project.

If RawBT is compatible with the existing implementation, use it as the
isolated Android print transport rather than introducing unnecessary
native Bluetooth complexity.

Preferred raw-data flow:

ESC/POS bytes
    ↓
Base64 if required
    ↓
RawBT intent
    ↓
Bluetooth printer

Keep all RawBT-specific code isolated inside the Android printer adapter.

Do NOT scatter RawBT intents across React components.

If RawBT is unavailable/not installed/not configured:

- do not crash checkout
- show a clear printer-unavailable state
- allow retry after setup
- preserve the already-created order

Handle activity/intent failure safely.

============================================================
PHASE 8 — DESKTOP / PC PRINTING
============================================================

For the PC web application, use:

React Web App
    ↓
Local Print Agent
    ↓
USB
    ↓
EZO 58mm Printer

Do NOT make window.print() the primary POS printing mechanism.

A browser print fallback may exist if required, but it must not become
the main workflow.

The local Print Agent must be isolated from the POS backend/database.

Use a dedicated localhost port.

DO NOT automatically choose 3000 or 8080 without first checking whether
those ports are already used by the existing application.

Use a configurable dedicated port, for example:

127.0.0.1:<configured-print-agent-port>

The agent should expose a small API conceptually similar to:

GET  /health
GET  /printers
GET  /status
POST /print
POST /test-print

The exact implementation may differ if an existing repository solution
is already available.

============================================================
PHASE 9 — LOCAL PRINT AGENT SECURITY
============================================================

The local PC print agent is a hardware-control service.

It MUST:

- bind only to 127.0.0.1
- never listen on 0.0.0.0 unless there is an explicit documented reason
- never expose USB printer control over the LAN
- restrict requests to the intended TBT Cafe frontend origin where applicable
- use a per-install local authentication token if needed by the design
- validate request schema
- reject malformed requests
- reject excessively large request bodies
- expose health/status safely
- never access or modify the POS database
- never create, update, delete, void, or change orders
- return deterministic success/failure results

If the local agent is unavailable, the POS MUST continue operating.

============================================================
PHASE 10 — OFFLINE-FIRST PRINT ORDER
============================================================

THIS IS CRITICAL.

The current TBT Cafe POS is offline-first.

Correct sequence:

Existing local SQLite transaction succeeds
    ↓
Order/bill is committed locally
    ↓
Print job created
    ↓
Print immediately
    ↓
Cloud/backend synchronization continues independently

NEVER:

Order
    ↓
wait for cloud
    ↓
sync
    ↓
print

Printing must NOT depend on internet access.

Follow the existing project's current offline transaction boundaries.
Do not insert printer logic into database internals unnecessarily.

The uploaded hardware research specifically requires printing
immediately after the local SQLite transaction rather than waiting for
cloud synchronization.

============================================================
PHASE 11 — PRINT JOB MANAGEMENT
============================================================

Introduce a printer-specific print-job layer only if the repository does
not already contain one.

Use states such as:

QUEUED
PRINTING
PRINTED
FAILED
RETRYING

A print failure MUST NOT:

- rollback a committed order
- delete an order
- duplicate an order
- alter payment state
- alter billing calculations

Example:

Order saved       ✓
Payment saved     ✓
Printer offline   ⚠
Print job FAILED

The user should be able to retry printing.

============================================================
PHASE 12 — IDEMPOTENCY / DUPLICATE PROTECTION
============================================================

Every print job must have a stable printJobId tied to the relevant
order/invoice.

Retries must reuse the SAME printJobId.

A retry must never create another order.

Handle app restart safely:

If an existing job is:

QUEUED / PRINTING

inspect its state rather than blindly generating another job.

Prevent accidental double-printing caused by:

- button double click
- frontend retry
- app reload
- Android lifecycle restart
- PC print-agent retry
- network sync events

============================================================
PHASE 13 — PRINTER ABSTRACTION
============================================================

Keep printer-specific code isolated.

Create a small abstraction conceptually supporting:

connect()
disconnect()
print()
testPrint()
getStatus()

Architecture:

ReceiptDocument
    ↓
PrinterService
    ├── AndroidPrinterAdapter
    └── DesktopPrinterAdapter

Do not put raw ESC/POS commands inside:

- checkout components
- order components
- dashboard
- API client
- database repository
- backend routes

The goal is to make the EZO adapter replaceable later without touching
billing logic.

============================================================
PHASE 14 — TEST PRINT
============================================================

Add a printer test operation in the existing appropriate printer/settings
area without redesigning unrelated Settings UI.

The test print must verify:

- 58mm formatting
- text
- bold
- alignment
- columns
- quantities
- amounts
- ₹
- long item names
- subtotal
- tax
- total
- payment method
- qr.jpg
- image conversion
- feed
- printer connectivity

Do not claim success simply because code compiles.

Physical hardware testing is required.

============================================================
PHASE 15 — DEPENDENCY DISCIPLINE
============================================================

Before adding any dependency:

1. Inspect current package.json.
2. Reuse existing dependencies where suitable.
3. Add only the minimum necessary dependencies.
4. Do not upgrade unrelated packages.
5. Do not replace framework versions.
6. Do not introduce a large printer SDK if a lightweight existing path is sufficient.
7. Keep Android native changes minimal and isolated.

============================================================
PHASE 16 — VERIFICATION
============================================================

After implementation:

1. Run existing frontend build.
2. Run TypeScript checks.
3. Run existing tests.
4. Validate Android build.
5. Validate desktop build.
6. Verify existing order creation still works.
7. Verify offline billing still works.
8. Verify existing sync still works.
9. Verify printer connection.
10. Verify actual EZO 58mm printing.
11. Verify correct alignment.
12. Verify long item wrapping.
13. Verify ₹ rendering.
14. Verify qr.jpg physically prints.
15. Scan printed QR.
16. Test printer disconnected.
17. Test print retry.
18. Test app restart during/after print.
19. Confirm no duplicate order is created.
20. Confirm no duplicate print occurs accidentally.
21. Confirm unrelated pages remain unchanged.

============================================================
FINAL CHANGE REPORT
============================================================

At the end, provide:

1. Exact files changed.
2. Why each changed file was required.
3. Any new dependencies added and why.
4. Android printing method.
5. PC printing method.
6. Exact qr.jpg path used.
7. Printer profile values used.
8. Test results.
9. Build results.
10. Any hardware-specific limitation discovered.

DO NOT silently perform unrelated cleanup,
formatting, renaming, refactoring, migrations, or dependency upgrades.

If you discover a conflict with the existing architecture,
STOP and explain the conflict before making a risky change.

FINAL PRINCIPLE:

Preserve the existing TBT Cafe POS.

Add printing.
Do not rebuild the POS.
Do not break existing functionality.
Do not touch the backend unnecessarily.
Do not invent missing information.
Inspect first, integrate second, verify third.