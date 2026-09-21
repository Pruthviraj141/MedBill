TBT CAFE POS — FULL PRINTER SYSTEM FORENSIC AUDIT
DO NOT MODIFY ANYTHING

I do NOT want another implementation right now.

I want you to completely understand the CURRENT printer implementation
already present in this repository, file-by-file and execution-path-by-
execution-path, before any further changes are made.

The goal is to determine whether the CURRENT implementation is actually
correct for:

1. Desktop/Web → EZO Chota/Bada 58mm printer via USB
2. Android APK → EZO Chota/Bada 58mm printer via Bluetooth + RawBT

IMPORTANT:
Do not claim that something is "fully working", "flawless", or "guaranteed"
unless the repository evidence actually proves it.

A physical EZO printer is NOT currently available, so you must clearly
separate:

A. Things that can be proven from code/tests
B. Things that can be tested with the current virtual printer
C. Things that REQUIRE the real EZO hardware

============================================================
RULE 1 — ABSOLUTELY NO CODE CHANGES
============================================================

This is a READ-ONLY forensic audit.

Do NOT:
- edit files
- create files
- delete files
- rename files
- install packages
- upgrade packages
- change package.json
- change environment files
- change backend
- change APIs
- change SQLite
- change Android code
- change frontend code
- refactor anything

Only inspect, trace, test, and report.

============================================================
RULE 2 — INSPECT THE ENTIRE RELEVANT FILE SYSTEM
============================================================

First inspect the repository structure thoroughly.

Identify and inspect every file relevant to printing, including but not
limited to:

- frontend package.json
- frontend source tree
- existing printer service
- PrinterService
- DesktopPrinterAdapter
- AndroidPrinterAdapter
- ESC/POS implementation
- receipt formatter
- ReceiptDocument mapper
- print queue/state implementation
- print-agent source
- usb-print-agent
- Vite configuration
- Capacitor configuration
- Android project configuration
- Android Manifest
- Android intent handling
- RawBT integration
- CORS implementation
- localhost proxy communication
- QR asset loading
- qr.jpg references
- environment variables
- npm scripts
- concurrently/process orchestration
- existing SQLite repositories
- checkout service
- order persistence
- sync code
- any printer-related tests

Search the ENTIRE repository for:

printer
print
receipt
escpos
escpos.ts
RawBT
rawbt:
Bluetooth
USB
28080
print-agent
usb-print-agent
qr.jpg
ReceiptDocument
PrinterService
DesktopPrinterAdapter
AndroidPrinterAdapter
printJobId
print queue
window.print
lp
CUPS
isNativePlatform
Capacitor.isNativePlatform

Do not assume a file is irrelevant merely because its name does not
contain "printer". Follow imports and execution paths.

============================================================
RULE 3 — TRACE THE DESKTOP FLOW LINE BY LINE
============================================================

Trace the COMPLETE desktop flow from button click to printer transport.

I want the exact execution chain:

User clicks Print
  ↓
Which React component/function?
  ↓
Which service?
  ↓
Which data is supplied?
  ↓
Which ReceiptDocument mapper?
  ↓
Which receipt formatter?
  ↓
Which ESC/POS encoder?
  ↓
Which HTTP request?
  ↓
Which localhost endpoint?
  ↓
Which print-agent route?
  ↓
Which parser?
  ↓
Which virtual/USB branch?
  ↓
Which OS command?
  ↓
Which CUPS/USB destination?

For every transition, identify the EXACT file and function.

Verify that the desktop browser NEVER attempts to use the Android RawBT
transport.

Verify that the desktop production/USB branch actually reaches the
physical USB transport.

Verify that virtual mode actually bypasses physical printing.

Verify whether the current CUPS command requires a configured printer,
and exactly how a printer is selected.

============================================================
RULE 4 — TRACE THE ANDROID FLOW LINE BY LINE
============================================================

Trace the COMPLETE Android flow independently.

I want:

User clicks Print
  ↓
checkout/print function
  ↓
platform detection
  ↓
Capacitor/native detection
  ↓
AndroidPrinterAdapter
  ↓
receipt generation
  ↓
ESC/POS encoding
  ↓
Base64 conversion
  ↓
RawBT URI/Intent
  ↓
Android intent handling
  ↓
RawBT package
  ↓
Bluetooth printer

Verify that Android APK execution does NOT accidentally call:

127.0.0.1:28080
Desktop print agent
CUPS
lp
Windows/Linux USB printing

Verify exactly how the Android code detects native Android.

Do not assume that a condition such as Capacitor.isNativePlatform()
automatically proves Android-only behavior. Inspect the surrounding
conditions and platform checks.

============================================================
RULE 5 — VERIFY THE RAWBT IMPLEMENTATION
============================================================

Inspect the actual Android implementation.

Confirm:

- exact URI format
- exact Base64 construction
- exact intent mechanism
- exact RawBT package/URI handling
- whether the implementation uses raw ESC/POS bytes
- whether the existing code sends HTML instead
- whether Capacitor allows the required intent
- what happens if RawBT is missing
- what happens if intent launch fails
- what happens if the printer is unavailable

Compare the implementation with the documented RawBT intent flow.

Do not change anything.

Report mismatches explicitly.

============================================================
RULE 6 — VERIFY THE ESC/POS GENERATOR
============================================================

Inspect ESCPOS.ts and every function that contributes to the print buffer.

Build an exact inventory of every ESC/POS command currently emitted.

For example, verify actual use of:

ESC @
ESC a
ESC E
GS !
LF
ESC d
image/raster commands
cut/feed commands
etc.

Do not assume the command set.

For every command, identify:

- exact bytes
- purpose
- source function
- where it is used
- whether virtual parser supports it
- whether desktop USB path preserves it
- whether Android path preserves it

Also inspect binary encoding and byte ordering.

============================================================
RULE 7 — VERIFY THE 58MM RECEIPT MODEL
============================================================

Inspect the actual receipt formatter.

Verify:

- paper width assumptions
- printable columns
- line lengths
- item wrapping
- quantity alignment
- amount alignment
- totals
- GST
- discounts
- payment method
- feed
- cut
- empty values
- long product names
- large totals
- multiple items

Do not assume "32 characters" is universally correct.

Report the actual configured values and where they come from.

============================================================
RULE 8 — VERIFY QR.JPEG/QR.JPG END TO END
============================================================

Locate the EXISTING qr.jpg using the real filesystem.

Report the exact path.

Trace:

qr.jpg
 ↓
asset loading
 ↓
image decoding
 ↓
resize
 ↓
monochrome conversion
 ↓
bitmap packing
 ↓
ESC/POS image command
 ↓
virtual renderer / real transport

Verify that the SAME existing qr.jpg is used.

Verify that no QR is being generated dynamically in place of it.

Verify the dimensions and final bitmap dimensions.

Verify the QR is centered and has sufficient quiet-zone space.

If physical scanability cannot be proven without hardware, explicitly say:

"Physical scanability requires hardware testing."

Do not claim otherwise.

============================================================
RULE 9 — VERIFY WEB/PC LOCAL AGENT
============================================================

Inspect the entire local print-agent implementation.

Confirm:

- exact host
- exact port
- /health
- /print
- /preview
- OPTIONS handling
- CORS
- request validation
- error handling
- virtual mode
- USB mode
- CUPS mode
- shutdown behavior

Confirm whether it binds to:

127.0.0.1

and whether it can accidentally bind to:

0.0.0.0

Confirm whether the agent can be reached by another device on the LAN.

Confirm whether the browser uses the correct localhost address.

Explain exactly what happens when the agent is not running.

============================================================
RULE 10 — VERIFY NPM DEV ORCHESTRATION
============================================================

Inspect the actual package.json.

Verify exactly what happens when:

npm run dev

is executed.

Confirm:

- Vite starts
- print agent starts
- both processes remain alive
- Ctrl+C terminates both
- there is no hidden second manual command
- virtual printer mode starts correctly
- environment-variable syntax is cross-platform or not

Do not modify package.json.

Report Linux/macOS behavior separately from Windows behavior if
different.

============================================================
RULE 11 — VERIFY OFFLINE-FIRST ORDER SAFETY
============================================================

Trace the checkout flow.

Prove the exact ordering:

SQLite/local order transaction
  ↓
successful local commit
  ↓
print trigger
  ↓
cloud sync independently

Verify that printing does NOT block successful order persistence.

Verify that cloud synchronization is NOT required for printing.

Verify that printer failure does NOT:
- rollback order
- delete order
- duplicate order
- duplicate payment
- alter totals

============================================================
RULE 12 — VERIFY PRINT JOB IDEMPOTENCY
============================================================

Inspect the actual implementation.

Determine whether print-job state is:

- memory only
- persistent
- SQLite-backed
- localStorage
- another mechanism

Verify:

- printJobId generation
- order.id association
- retry behavior
- app restart behavior
- double-click behavior
- duplicate submission behavior

Do not assume that an in-memory lock provides restart-safe idempotency.

Report exactly what is and is not protected.

============================================================
RULE 13 — VERIFY VIRTUAL PRINTER
============================================================

Inspect the virtual ESC/POS renderer line by line.

Determine:

- which ESC/POS commands it actually parses
- which are unsupported
- whether unsupported commands are ignored
- whether QR/image data is actually rendered
- whether text alignment is correct
- whether bold/size commands are correct
- whether feed commands are correct
- whether the preview truly represents the generated ESC/POS bytes

Verify that the virtual renderer consumes the SAME binary buffer used by
the eventual physical printer path.

Do not call the virtual renderer an "exact EZO emulator" unless the code
actually proves that.

============================================================
RULE 14 — VERIFY REAL EZO COMPATIBILITY
============================================================

This is critical.

We are targeting the EZO Chota/Bada 58mm thermal machine.

Use the repository evidence plus known documented integration behavior,
but do NOT claim hardware compatibility that cannot be proven without
the physical unit.

Determine:

1. Is the implementation producing standard ESC/POS?
2. Is the image command compatible with likely EZO/58mm behavior?
3. Is the text encoding configurable?
4. Is ₹ supported/tested?
5. Is Bluetooth transport handled through RawBT?
6. Is USB transport handled through CUPS/raw output?
7. Are there any hardware-specific assumptions?
8. Which points require physical EZO verification?

Clearly separate:

PROVEN
LIKELY
REQUIRES HARDWARE TEST

============================================================
RULE 15 — SECURITY REVIEW
============================================================

Inspect security around the local print agent.

Verify:

- binding
- CORS
- origin handling
- request validation
- localhost exposure
- authentication if any
- oversized request handling

Do not change anything.

Point out anything that could allow another local/LAN application to
trigger printing.

============================================================
RULE 16 — BUILD AND TEST REVIEW
============================================================

Run/read existing tests and build configuration where safe, but do not
modify anything.

Verify:

- frontend TypeScript
- frontend build
- Android build configuration
- printer agent startup
- /health
- /preview
- virtual print path

Do not install dependencies or alter configuration just to make tests
pass.

============================================================
FINAL REPORT FORMAT
============================================================

Return a detailed forensic report with these sections:

1. CURRENT ARCHITECTURE
2. EXACT DESKTOP EXECUTION FLOW
3. EXACT ANDROID EXECUTION FLOW
4. FILE-BY-FILE PRINTER MAP
5. ESC/POS COMMAND INVENTORY
6. 58MM RECEIPT ANALYSIS
7. qr.jpg EXACT PATH + PIPELINE
8. DESKTOP USB/CUPS ANALYSIS
9. ANDROID RAWBT ANALYSIS
10. VIRTUAL PRINTER ANALYSIS
11. OFFLINE/SQLITE SAFETY ANALYSIS
12. PRINT JOB IDEMPOTENCY ANALYSIS
13. SECURITY ANALYSIS
14. BUILD/TEST RESULTS
15. PROVEN TO WORK FROM CODE
16. PROVEN TO WORK IN VIRTUAL TESTING
17. REQUIRES PHYSICAL EZO TESTING
18. RISKS / BUGS / CONTRADICTIONS FOUND
19. EXACT MINIMUM CHANGES NEEDED, IF ANY

For every detected problem, identify:

- exact file
- exact function
- exact issue
- why it is an issue
- severity
- safest minimal fix

DO NOT FIX ANYTHING YET.

FINAL RULE:

Do not tell me "it works perfectly" simply because the code looks correct.

I want evidence.

I want you to understand the entire current implementation first.

No code modifications.
No refactoring.
No new dependencies.
No "improvements".

AUDIT ONLY.