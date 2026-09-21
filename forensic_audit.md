# TBT CAFE POS — FULL PRINTER SYSTEM FORENSIC AUDIT REPORT
**Status: READ-ONLY. Zero files modified.**  
**Audit Date: 2026-09-19 | Evidence-based only.**

---

## 1. CURRENT ARCHITECTURE

The system has two independent print transports driven by a shared `printerService.ts` orchestrator:

```
DesktopBilling.tsx (Web/Desktop)
  └─► printerService.printOrder()
        ├─► createReceiptDocument()   [ReceiptDocument.ts]
        ├─► ReceiptFormatter.generate() [receiptFormatter.ts + ESCPOS.ts]
        ├─► loadAndEncodeQR()          [qrHandler.ts → qr.jpg @ repo root]
        ├─► escpos.feed() + cut()
        ├─► getBase64()
        └─► Capacitor.isNativePlatform() ?
              TRUE  → printViaAndroidRawBT()   [AndroidPrinterAdapter.ts]
              FALSE → printViaDesktopProxy()   [DesktopPrinterAdapter.ts]
                        └─► POST http://127.0.0.1:28080/print
                              └─► usb-print-agent/server.js
                                    PRINTER_MODE=virtual → parseESCPOS() + /preview
                                    PRINTER_MODE=<other> → lp -o raw (Linux/Mac) / print /D: (Windows)
```

**Mobile (Android APK) Billing.tsx checkout path:** Does NOT call printerService. It uses `jsPDF + htmlToImage` for a PDF download only. No thermal print trigger exists in the mobile UI.

---

## 2. EXACT DESKTOP EXECUTION FLOW

**Trigger:** User clicks CASH or UPI button in `DesktopBilling.tsx`

| Step | File | Function | Detail |
|------|------|----------|--------|
| 1 | `DesktopBilling.tsx:71-110` | `checkout.mutationFn` | Calls `checkoutService.createOrder()` |
| 2 | `checkoutService.ts:12-63` | `createOrder()` | Validates cart, fetches products from repo, builds Order + items, writes to SQLite/D1 |
| 3 | `ordersRepository.ts:12-44` | `nativeImpl.createOrderBase()` | On Android: atomic SQLite executeSet (order + items + sync_queue in one transaction). On Web: POST to D1 cloud API |
| 4 | `DesktopBilling.tsx:97-108` | `onSuccess` callback | Sets `lastOrder` (triggers confetti ticket UI). Then fire-and-forget: `printerService.printOrder()` |
| 5 | `printerService.ts:19` | `createReceiptDocument()` | Reads `settingsRepository.getSetting('businessName')` → builds ReceiptDocument |
| 6 | `printerService.ts:22-23` | `ReceiptFormatter.generate()` | Builds full ESC/POS byte buffer |
| 7 | `printerService.ts:26-33` | `loadAndEncodeQR()` | Loads `qr.jpg` → Canvas 2D decode → monochrome bitmap → printRaster() appended |
| 8 | `printerService.ts:36-37` | `feed(3) + cut()` | Appends 3-line feed + full cut command |
| 9 | `printerService.ts:40` | `getBase64()` | Serializes buffer to base64 string |
| 10 | `printerService.ts:43-46` | `Capacitor.isNativePlatform()` | Returns **false** on desktop browser → routes to `printViaDesktopProxy()` |
| 11 | `DesktopPrinterAdapter.ts:6-13` | `printViaDesktopProxy()` | `fetch('http://127.0.0.1:28080/print', { method: 'POST', body: { payload: base64 } })` |
| 12 | `server.js:88-138` | Express POST /print | Decodes base64 → Buffer. If `PRINTER_MODE=virtual` → parseESCPOS() + saves HTML. Else → writes temp file + `lp -o raw <tmpfile>` |
| 13 | OS | `lp` command | Sends raw binary to default CUPS printer queue |

**Verified:** Desktop browser never attempts `window.location.href = rawbt:...`. Platform guard at step 10 is correct.

---

## 3. EXACT ANDROID EXECUTION FLOW

**Trigger:** User clicks CASH or UPI in `DesktopBilling.tsx`.

> [!WARNING]
> **The mobile `Billing.tsx` (Android APK UI) does NOT call `printerService` at all.** The thermal print path in `DesktopBilling.tsx` is the only wired thermal trigger. On Android, `DesktopBilling.tsx` is NOT the active billing component — the app uses `Billing.tsx` which shows a PDF download modal instead. The thermal path below describes what WOULD happen if `printerService.printOrder()` were called from Android (e.g., via `DesktopBilling.tsx` on a tablet).

| Step | File | Function | Detail |
|------|------|----------|--------|
| 1-9 | Same as desktop | — | Identical receipt building pipeline |
| 10 | `printerService.ts:43` | `Capacitor.isNativePlatform()` | Returns **true** on Android APK → routes to `printViaAndroidRawBT()` |
| 11 | `AndroidPrinterAdapter.ts:6` | `printViaAndroidRawBT()` | `window.location.href = \`rawbt:base64,${base64Payload}\`` |
| 12 | Android WebView | Intent navigation | Android intercepts `rawbt:` URI scheme and fires implicit intent to RawBT app |
| 13 | RawBT (external) | RawBT app | Decodes base64 ESC/POS bytes → sends to configured Bluetooth printer |

**Verified:** Android path never calls `127.0.0.1:28080`. No CUPS, no lp, no USB on Android.

---

## 4. FILE-BY-FILE PRINTER MAP

| File | Role |
|------|------|
| `frontend/src/services/printer/printerService.ts` | Orchestrator — builds receipt, routes to correct adapter |
| `frontend/src/services/printer/ReceiptDocument.ts` | Data mapper: Order+OrderItems → structured ReceiptDocument |
| `frontend/src/services/printer/receiptFormatter.ts` | Layout engine: ReceiptDocument → ESCPOS byte stream |
| `frontend/src/services/printer/ESCPOS.ts` | ESC/POS byte encoder class |
| `frontend/src/services/printer/printerProfile.ts` | Printer profile constants (58mm, 32 cols, 200px QR) |
| `frontend/src/services/printer/qrHandler.ts` | Loads `qr.jpg`, resizes via Canvas 2D, converts to 1bpp bitmap |
| `frontend/src/services/printer/AndroidPrinterAdapter.ts` | Android: fires `rawbt:base64,<data>` URL intent |
| `frontend/src/services/printer/DesktopPrinterAdapter.ts` | Desktop: POSTs base64 to `http://127.0.0.1:28080/print` |
| `frontend/src/services/printer/printQueue.ts` | localStorage-backed failed-job queue |
| `frontend/src/features/desktop/Billing/DesktopBilling.tsx` | **Only UI that calls `printerService.printOrder()`** |
| `frontend/src/features/desktop/Settings/DesktopSettings.tsx` | Test print + retry-failed-print buttons |
| `frontend/src/features/billing/Billing.tsx` | Mobile billing UI — uses `jsPDF` PDF only, no thermal print |
| `frontend/src/components/ui/ticket-confirmation-card.tsx` | Post-checkout UI — PDF download via `htmlToImage + jsPDF` only |
| `usb-print-agent/server.js` | Node.js Express agent on `127.0.0.1:28080` |
| `usb-print-agent/package.json` | Agent deps: `express`, `cors` only |
| `frontend/capacitor.config.ts` | Capacitor: `webDir: dist`, `androidScheme: https` |
| `frontend/vite.config.ts` | Vite on `0.0.0.0:5173`, no proxy configured for agent |
| `frontend/android/app/src/main/AndroidManifest.xml` | Only `INTERNET` permission declared |
| `qr.jpg` (repo root) | Source QR asset consumed by `qrHandler.ts` |

---

## 5. ESC/POS COMMAND INVENTORY

All commands emitted by `ESCPOS.ts` + `receiptFormatter.ts`:

| Function | Bytes (hex) | Purpose | Virtual Parser supports? | USB path preserves? | Android path preserves? |
|----------|-------------|---------|--------------------------|---------------------|-------------------------|
| `init()` | `1B 40` | Printer initialization / reset | ✅ (handled as align=left, bold=false) | ✅ | ✅ |
| `alignLeft()` | `1B 61 00` | Align left | ✅ | ✅ | ✅ |
| `alignCenter()` | `1B 61 01` | Align center | ✅ | ✅ | ✅ |
| `alignRight()` | `1B 61 02` | Align right | ✅ | ✅ | ✅ |
| `boldOn()` | `1B 45 01` | Bold on | ✅ | ✅ | ✅ |
| `boldOff()` | `1B 45 00` | Bold off | ✅ | ✅ | ✅ |
| `text(str)` | raw ASCII bytes | Print characters; ₹ replaced by `Rs.` | ✅ (byte >= 0x20) | ✅ | ✅ |
| `newline()` | `0A` | Line feed | ✅ (`0x0A` flushes line) | ✅ | ✅ |
| `feed(n)` | `1B 64 n` | Feed n lines | ✅ (n flushLine calls) | ✅ | ✅ |
| `cut()` | `1D 56 41 00` | Full paper cut | ✅ (rendered as dashed border) | ✅ | ✅ |
| `printRaster(w,h,bits)` | `1D 76 30 00 xL xH yL yH <data>` | GS v 0 raster bitmap | ✅ (canvas rendered in browser) | ✅ | ✅ |

**NOT used:** `GS !` (text scaling/double-width), `ESC M` (font select), `ESC t` (codepage), `GS k` (barcode), `FS .` (kanji mode)

**Binary encoding note:** `ESCPOS.text()` iterates character by character using `charCodeAt()` — this is plain ASCII/latin1 encoding. Any character code > 127 (e.g., Unicode beyond latin1) will emit incorrect bytes. The `₹` (U+20B9) is explicitly detected and replaced with `Rs.` before encoding. Other non-ASCII chars are NOT handled.

---

## 6. 58MM RECEIPT ANALYSIS

**Profile source:** `printerProfile.ts → INITIAL_58MM_PROFILE`

| Parameter | Configured Value | Notes |
|-----------|-----------------|-------|
| `paperWidthMm` | 58 | Nominal paper width |
| `targetColumns` | 32 | Character columns at default font |
| `qrSizePx` | 200 | Max QR image width in pixels |

**Column budget breakdown (in `formatItemRow`):**

```
Total width  = 32 columns
QTY column   = 4 chars (right-padded)
PRICE column = 8 chars (right-padded)
SEPARATOR    = 1 char
NAME column  = 32 - 4 - 8 - 1 = 19 chars (with word wrap)
```

**Separator:** `'-'.repeat(32)` — 32 dashes per row.

**Layout sections generated (in order):**
1. Business name (center, bold)
2. "TAX INVOICE" (center)
3. Empty line
4. Invoice #, Date, Time (left-aligned)
5. Separator
6. Table header: ITEM/QTY/AMT (bold)
7. Separator
8. All items (word-wrapped if name > 19 chars)
9. Separator
10. Subtotal (left, formatted as `Rs.X.XX`)
11. Discount row (only if discount > 0)
12. GST row (only if gst > 0 — hardcoded to 0 in `ReceiptDocument.ts`)
13. Separator
14. TOTAL (bold)
15. Separator
16. Payment method
17. Empty line
18. QR bitmap (via `printRaster`)
19. `feed(3)` + `cut()`

**Edge cases identified:**
- Very long product names (>19 chars): handled by word-wrapping in `formatItemRow`. Lines beyond the first line do NOT include qty/price, which is correct.
- Long totals (e.g., `Rs.99999.99` = 11 chars): fits in 8-char column only if total < `Rs.9999.99` (8 chars). `Rs.10000.00` = 9 chars → **overflows 8-char column → column misalignment**. Severity: Medium.
- GST: always 0. The `ReceiptDocument.ts` hardcodes `gst: 0`. GST row will never print.
- Empty cart: `checkoutService.createOrder()` throws if cart is empty — so an empty receipt is impossible from normal flow.

---

## 7. QR.JPG EXACT PATH + PIPELINE

**Exact file path:** `/home/pruthvi/Documents/cafe-pos-v1/qr.jpg` (102,584 bytes)

**Import path in `qrHandler.ts`:**
```typescript
import qrAssetUrl from '../../../../qr.jpg';
```
Resolved from `frontend/src/services/printer/qrHandler.ts` → `4 levels up` → repo root `/qr.jpg`.  
Vite bundles this as a static asset; `qrAssetUrl` becomes the resolved URL at runtime.

**QR Pipeline:**

```
qr.jpg (disk)
  ↓ Vite static asset import → hashed URL in bundle
  ↓ loadImage(url) → new Image() with crossOrigin='Anonymous' → img.onload
  ↓ drawWidth = min(img.width, 200px)   [from INITIAL_58MM_PROFILE.qrSizePx]
  ↓ drawWidth rounded DOWN to nearest multiple of 8: Math.floor(drawWidth/8)*8
  ↓ drawHeight = floor(proportional)
  ↓ Canvas 2D: fillRect white → drawImage → getImageData (RGBA)
  ↓ rgbaToMonochrome(): luminance formula (0.2126R + 0.7152G + 0.0722B), threshold 128
    → 1bpp Uint8Array, MSB-first bit packing, byte-aligned per row
  ↓ printRaster(w, h, bits) → GS v 0 00 xL xH yL yH <bits>
  ↓ ESC/POS buffer (embedded in full receipt stream)
```

**Verified:**
- The SAME existing `qr.jpg` at repo root is used — no dynamic QR generation.
- It is a static JPEG image (likely a UPI payment QR or cafe branding QR).
- White background fill before draw ensures transparent PNG/JPEG areas become white (not black).
- draw is constrained to 200px max width → then floor-to-8 → actual max printed width = 200px = 200 dots.
- On real 58mm @ 203 DPI: printable width ≈ 384–400 dots. QR will be ~200 dots wide — roughly half of printable width. Centering is applied via `escpos.alignCenter()` before `printRaster()` in `printerService.ts`.

**Physical scanability:** ⚠️ REQUIRES HARDWARE TEST. The QR content (what the `qr.jpg` encodes), module size after 200px scaling, and quiet zone adequacy cannot be confirmed without printing.

---

## 8. DESKTOP USB/CUPS ANALYSIS

**Agent:** `usb-print-agent/server.js` — Node.js Express

**Binding:** `app.listen(PORT, '127.0.0.1', ...)` — binds to loopback only. **Cannot be reached from LAN.**

**Linux/Mac USB path (production mode):**
```javascript
const tempPath = `/tmp/pos_receipt_${Date.now()}.bin`;
fs.writeFileSync(tempPath, buffer);
exec(`lp -o raw ${tempPath}`, (error) => { ... });
```

**Issues with CUPS command:**
1. `lp -o raw <file>` sends to the **default CUPS printer** — no printer is explicitly specified.
2. If no default printer is configured, `lp` will fail silently (error logged to server console only).
3. The EZO printer must be configured as the default CUPS printer OR the command must be changed to `lp -d <EZO-printer-name> -o raw`.
4. Temp file is cleaned up after exec — even if the job fails. No way to re-examine the buffer.
5. Error from `exec()` is logged to console only; the HTTP response already sent `200 OK` before `exec()` completes (fire-and-forget). **Client always receives success even if print failed.**

**Windows path:**
```javascript
exec(`print /D:"\\\\localhost\\ThermalPrinter" "${tempPath}"`);
```
Hardcodes the printer share name `\\localhost\ThermalPrinter`. This will fail unless the printer is shared under exactly that name. Not relevant for Linux deployment.

**Virtual mode:**
- Activated by `PRINTER_MODE=virtual` env var (set by `dev:print-agent` script).
- Parses ESC/POS bytes → generates HTML → stores in `lastVirtualReceipt` (in-memory).
- Browseable at `http://127.0.0.1:28080/preview`.
- This in-memory state is cleared on agent restart.

---

## 9. ANDROID RAWBT ANALYSIS

**Implementation:** `AndroidPrinterAdapter.ts`
```typescript
window.location.href = `rawbt:base64,${base64Payload}`;
```

**URI format:** `rawbt:base64,<base64-encoded-ESC/POS-bytes>`

**Intent mechanism:** Capacitor WebView intercepts this URI navigation and fires an Android implicit intent. The Android OS resolves it to RawBT if installed.

**Confirmed:**
- The payload is raw ESC/POS binary, base64-encoded — NOT HTML.
- The RawBT app handles `rawbt:` URI scheme and decodes base64 to ESC/POS bytes.

**Issues and missing pieces:**

| Item | Finding | Severity |
|------|---------|----------|
| Bluetooth permissions | `AndroidManifest.xml` declares only `INTERNET`. **No `BLUETOOTH`, `BLUETOOTH_CONNECT`, or `BLUETOOTH_SCAN` permissions.** RawBT manages Bluetooth itself, so the app doesn't directly need them — but this is unverified. | REQUIRES HARDWARE TEST |
| No custom intent-filter for `rawbt:` | No `<intent-filter>` for `rawbt:` scheme in Manifest. The intent is outgoing (fired by WebView) — no filter needed. Correct. | OK |
| Success detection | `resolve(true)` is called immediately after setting `window.location.href`. There is NO callback from RawBT. If the intent fails (RawBT not installed, Bluetooth off, printer off), `printViaAndroidRawBT` still returns `true`. | HIGH |
| RawBT not installed | If RawBT is not installed, Android will show "No app found to handle this intent" dialog. The POS app cannot detect this. | HIGH |
| Thermal flow never triggered from mobile UI | `Billing.tsx` (the mobile billing screen) does NOT call `printerService`. Only `DesktopBilling.tsx` calls it. On Android, `DesktopBilling.tsx` is only shown if the desktop routing branch is active. | CRITICAL (see Section 18) |

---

## 10. VIRTUAL PRINTER ANALYSIS

**File:** `usb-print-agent/server.js:16-86` — `parseESCPOS(buffer)`

**Commands parsed:**

| Command | Bytes | Action in Virtual Renderer |
|---------|-------|---------------------------|
| `ESC @` (1B 40) | Init | Resets align=left, bold=false |
| `ESC a n` (1B 61 n) | Align | Sets align: left(0), center(1), right(2) |
| `ESC E n` (1B 45 n) | Bold | Sets bold: true(1), false(0) |
| `ESC d n` (1B 64 n) | Feed n lines | Calls `flushLine()` n times |
| `0x0A` | Newline | Calls `flushLine()` |
| `GS v 0` (1D 76 30 ...) | Raster bitmap | Reads xL/xH/yL/yH, reads pixel bytes, renders to `<canvas data-bits="...">` |
| `GS V A 00` (1D 56 41 00) | Cut | Renders `<div>` with dashed border |
| Byte >= 0x20 | Printable char | Appended to `currentLine` |

**Commands NOT parsed (silently consumed or cause index corruption):**
- `ESC M` (font), `ESC t` (codepage), `ESC !` (print mode) — not emitted by ESCPOS.ts, so no impact.
- Unknown ESC sequences: only `c` is read after 0x1B (`c` is consumed) — unknown sub-byte is consumed but no further bytes skipped, which can cause index drift for multi-byte commands. Since ESCPOS.ts only emits known commands, this is low risk but fragile.

**Virtual renderer limitations:**
- Canvas bitmap rendering via `data-bits` attribute is done in a `<script>` tag injected into the HTML. This requires JavaScript in the browser viewing `/preview`. 
- The virtual renderer is NOT an exact EZO emulator. It renders the correct logical structure but does not simulate thermal paper behavior, dot density, or real font width.
- Text is rendered in browser monospace font (14px), not at 58mm physical character dimensions.
- The renderer DOES consume the same binary buffer that would go to the physical printer — this is confirmed correct.

---

## 11. OFFLINE/SQLITE SAFETY ANALYSIS

**Order persistence flow in `checkoutService.ts → ordersRepository.ts`:**

**On Android (Native):**
```
createOrder() [checkoutService.ts]
  → ordersRepository.createOrderBase() [nativeImpl]
      → db.executeSet([orderStmt, ...itemStmts, syncStmt])
         ← atomic SQLite transaction (all-or-nothing)
      → returns Order on success, throws on failure
  ← Order returned to Billing.tsx mutationFn
  → onSuccess fires → printerService.printOrder() [fire-and-forget]
```

**On Web (Desktop browser):**
```
createOrder() [checkoutService.ts]
  → ordersRepository.createOrderBase() [webImpl]
      → webApiClient.post('/orders', payload)
         ← D1 cloud API call
      → returns Order
  ← Order returned to DesktopBilling.tsx mutationFn
  → onSuccess fires → printerService.printOrder() [fire-and-forget]
```

**Verified safe:**
- ✅ SQLite transaction commits before print is triggered.
- ✅ Print failure does NOT roll back the order.
- ✅ Print failure does NOT delete the order.
- ✅ Cloud sync is NOT required for printing.
- ✅ The sync queue entry is part of the same SQLite `executeSet` — sync and order committed together atomically.
- ✅ `printQueue.addFailedJob()` is called if `printOrder()` returns false — stores to `localStorage` for retry.

**One gap:** On the Web path, if `webApiClient.post('/orders')` fails (network error), the order is NOT persisted (no local SQLite on web). Print is never triggered in this case. This is not a printer system bug — it is inherent to the web-only branch behavior.

---

## 12. PRINT JOB IDEMPOTENCY ANALYSIS

**Implementation:** `printQueue.ts`

**State storage:** `localStorage` — key: `tbt_failed_prints`

**Structure per job:**
```typescript
{ order: Order, items: OrderItem[], timestamp: number }
```

**Deduplication:** `addFailedJob` checks `jobs.find(j => j.order.id === order.id)` before pushing. Prevents the same order appearing twice in the failed queue.

**What is protected:**
- ✅ Duplicate click: `checkout.isPending` disables the checkout buttons during the mutation — prevents double submission at the UI level.
- ✅ Failed-print idempotency: same `order.id` won't be queued twice in `localStorage`.
- ✅ `printJobId` is implicitly `order.id` (no separate UUID).

**What is NOT protected:**
- ❌ **App restart:** If print was in-flight when app restarted, the `printOrder()` call is lost. `addFailedJob` is only called if `printOrder()` returns false — it is never called for mid-flight situations. On restart, neither the print state nor the failure is recorded.
- ❌ **Successful job confirmation is false:** `printViaAndroidRawBT` always returns `true` even if RawBT fails. This means failed Android prints ARE NOT added to `printQueue`. The failed-job retry mechanism only works for Desktop (where HTTP response can be evaluated).
- ❌ **Restart-safe:** `localStorage` survives app restarts (web/PWA), but on Android native Capacitor, `localStorage` may be cleared under storage pressure. Not restart-safe in strict sense.
- ❌ **No printJobId in database:** Print state is entirely in `localStorage`, not in SQLite. An order in SQLite has no field indicating whether it was printed.

---

## 13. SECURITY ANALYSIS

### Print Agent (`usb-print-agent/server.js`)

| Check | Finding | Verdict |
|-------|---------|---------|
| Binding | `app.listen(28080, '127.0.0.1')` | ✅ Loopback only. LAN cannot reach it. |
| Can it bind to 0.0.0.0? | Only if code is changed. Current code is hardcoded to `'127.0.0.1'` | ✅ Safe as-is |
| CORS | `cors({ origin: '*', methods: ['GET','POST','OPTIONS'] })` | ⚠️ Wildcard `*`. Any browser tab on the same machine can trigger a print by POSTing to 127.0.0.1:28080/print |
| Request validation | Checks only that `payload` field exists. No size limit beyond Express `10mb` JSON limit. | ⚠️ No content validation of base64 payload |
| Authentication | None | ⚠️ Any local process/browser can trigger printing |
| `/health` | Returns `{ status: 'ok' }`. No auth needed. | ✅ Acceptable |
| `/preview` | Returns last-generated HTML. No auth. Another tab could view receipt. | ⚠️ Minor info leak |
| Oversized request | `express.json({ limit: '10mb' })` — 10MB max. A large image QR could realistically approach this. | ✅ Bounded |
| Print temp file | Written to `/tmp/` with predictable name pattern `pos_receipt_<timestamp>.bin`. Symlink attack theoretically possible but low practical risk on a single-user POS machine. | Low risk |
| `lp` injection | Temp file path is built by `Date.now()` — no user input. No injection risk. | ✅ Safe |

**Summary:** The primary security concern is the wildcard CORS — any browser running locally (another tab, a malicious iframe in any visited website) can POST to `127.0.0.1:28080/print` and trigger printing. Since the machine is a dedicated POS terminal, the practical risk is low but technically present.

---

## 14. BUILD/TEST RESULTS

**`npm run dev` (from `frontend/`):**
```
concurrently "npm run dev:web" "npm run dev:print-agent"
  → dev:web:        vite --host 0.0.0.0     (binds all interfaces, port 5173)
  → dev:print-agent: cd ../usb-print-agent && npm install && PRINTER_MODE=virtual npm start
```

**Verified:**
- ✅ Both processes launched by single `npm run dev` command.
- ✅ `PRINTER_MODE=virtual` is set for the agent — virtual interception is automatic in dev.
- ✅ Both processes die on Ctrl+C (concurrently handles process groups).
- ⚠️ `PRINTER_MODE=virtual` syntax uses bash env var syntax. On Windows PowerShell, this would fail (`$env:PRINTER_MODE=virtual npm start` is required). Linux/macOS: ✅ works.
- ⚠️ `npm install` is run every time the print agent starts — this adds startup latency on first run. Subsequent runs are fast (already installed).

**TypeScript check (`npm run typecheck`):** Not run during audit (read-only). No known type errors observed from code inspection. Strong typing used throughout printer services.

**Tests found:** `npm run test:sqlite` and `npm run test:sync` exist. No printer-specific tests found in the codebase. `testing/` directory contains only `info_testing.md`. No unit tests for ESC/POS encoding, receipt layout, or print adapters exist.

---

## 15. PROVEN TO WORK FROM CODE

- ✅ Desktop checkout → SQLite/D1 persistence is independent of printing.
- ✅ `Capacitor.isNativePlatform()` correctly routes desktop browser to `DesktopPrinterAdapter`.
- ✅ `DesktopPrinterAdapter` POSTs to `127.0.0.1:28080` — correct loopback address.
- ✅ Print agent binds only to `127.0.0.1` — secure by default.
- ✅ `print()` failure on desktop: HTTP non-OK response → `addFailedJob()` → `localStorage` queue.
- ✅ Virtual mode intercept: `PRINTER_MODE=virtual` → `parseESCPOS()` → HTML preview.
- ✅ QR uses the existing static `qr.jpg` — confirmed, no dynamic generation.
- ✅ White background fill before canvas draw prevents transparent-to-black problems.
- ✅ Monochrome conversion uses proper luminance formula (not simple average).
- ✅ ESC/POS `GS v 0` raster command sent with correct byte structure: `1D 76 30 00 xL xH yL yH data`.
- ✅ Print does not block or interfere with order persistence — fire-and-forget post-commit.
- ✅ Double-click protection: `checkout.isPending` disables buttons during mutation.
- ✅ `₹` symbol is replaced with `Rs.` before encoding — prevents ESC/POS encoding corruption.
- ✅ Word-wrap for item names > 19 chars: implemented in `formatItemRow()`.

---

## 16. PROVEN TO WORK IN VIRTUAL TESTING

- ✅ `npm run dev` starts both vite and print agent with one command.
- ✅ `POST http://127.0.0.1:28080/print` with base64 payload → agent responds `200 { success: true }` in virtual mode.
- ✅ `GET http://127.0.0.1:28080/preview` → renders HTML receipt with canvas bitmap.
- ✅ `GET http://127.0.0.1:28080/health` → `{ status: 'ok' }`.
- ✅ ESC/POS parser handles: align, bold, newline, feed, cut, raster — all commands emitted by ESCPOS.ts.
- ✅ Canvas QR rendering in browser via `data-bits` attribute and inline script.

---

## 17. REQUIRES PHYSICAL EZO TESTING

- ❓ EZO printer responds correctly to `GS v 0` raster bitmap command (vs `GS 8 L` or `GS ( L` used by some models).
- ❓ `lp -o raw` (no explicit printer name) selects the correct EZO CUPS queue.
- ❓ 32-column layout prints without overflow on actual EZO paper width.
- ❓ QR code is physically scanable at 200px rendered size on thermal paper.
- ❓ `Rs.` renders correctly (no codepage surprises for `R` and `.`).
- ❓ Full cut (`1D 56 41 00`) works on EZO — some models use `1D 56 00` (partial cut).
- ❓ RawBT receives rawbt:base64 URI from Capacitor WebView on Android.
- ❓ Bluetooth permissions are sufficient for RawBT to operate (managed by RawBT, not the app).
- ❓ Feed (3 lines via `ESC d 03`) provides correct paper advancement on EZO.
- ❓ Physical scanability of QR with quiet zone margins and module sizing.

---

## 18. RISKS / BUGS / CONTRADICTIONS FOUND

### 🔴 BUG 1 — CRITICAL: Android thermal print is NEVER triggered from the mobile billing UI

| Field | Detail |
|-------|--------|
| **File** | `frontend/src/features/billing/Billing.tsx` |
| **Function** | `checkout.mutationFn → onSuccess` |
| **Issue** | `Billing.tsx` (the mobile/Android billing screen) does NOT import or call `printerService`. The `onSuccess` callback only calls `setLastOrder()` and `clear()`. The `AnimatedTicket` rendered afterwards offers only a PDF download (`jsPDF`). No thermal print is triggered on Android. |
| **Why it matters** | The entire Android RawBT thermal print path exists in code but is NEVER called from the active Android UI. A physical EZO Bluetooth printer connected to an Android device would never receive a print job from normal checkout. |
| **Severity** | 🔴 CRITICAL |
| **Safest fix** | Import `printerService` into `Billing.tsx`. In `onSuccess`, after `setLastOrder(uiOrder)`, add `printerService.printOrder(uiOrder, uiOrder.items).then(ok => { if(!ok) printQueue.addFailedJob(uiOrder, uiOrder.items); });` |

---

### 🔴 BUG 2 — HIGH: Android adapter always returns `true` — failed prints silently lost

| Field | Detail |
|-------|--------|
| **File** | `AndroidPrinterAdapter.ts:10` |
| **Function** | `printViaAndroidRawBT` |
| **Issue** | `resolve(true)` is called immediately after `window.location.href = rawbt:...`. There is no callback. If RawBT is not installed, Bluetooth is off, or printer is unavailable, the function returns `true`. `printQueue.addFailedJob()` is never triggered for Android failures. |
| **Severity** | 🔴 HIGH |
| **Safest fix** | Wrap in a try/catch and resolve(false) on exception. Additionally, use a visibility-change heuristic (if the app returns to foreground within 2s, assume RawBT navigated away successfully). True callback is not possible with URI-scheme intents. |

---

### 🟠 BUG 3 — MEDIUM: Desktop USB path always returns HTTP 200 even if `lp` fails

| Field | Detail |
|-------|--------|
| **File** | `usb-print-agent/server.js:128-134` |
| **Function** | POST /print handler, USB branch |
| **Issue** | `res.status(200).send(...)` is returned before `exec('lp ...')` completes. `lp` errors are console-logged only. The frontend `printViaDesktopProxy()` receives `200 OK` and returns `true` even if CUPS rejected the job. `printQueue.addFailedJob()` is never triggered for CUPS failures. |
| **Severity** | 🟠 MEDIUM |
| **Safest fix** | Restructure to use a callback: send HTTP 202 immediately, or wait for `exec` to complete before responding. |

---

### 🟠 BUG 4 — MEDIUM: CUPS printer not specified — uses default

| Field | Detail |
|-------|--------|
| **File** | `usb-print-agent/server.js:128` |
| **Command** | `lp -o raw ${tempPath}` |
| **Issue** | No `-d <printer>` flag. If the default CUPS printer is not the EZO, the receipt will print to the wrong device or fail silently. |
| **Severity** | 🟠 MEDIUM |
| **Safest fix** | Add `-d` flag with the EZO's CUPS queue name. Make it configurable via env var `PRINTER_NAME`. |

---

### 🟡 BUG 5 — MEDIUM: Price column overflow for large totals

| Field | Detail |
|-------|--------|
| **File** | `receiptFormatter.ts:96, 106, 116` |
| **Function** | `generate()` |
| **Issue** | Price column is 8 chars wide. `Rs.10000.00` = 10 chars. For orders >= 10,000, the total column overflows and breaks alignment on all rows using `formatRow()`. |
| **Severity** | 🟡 MEDIUM |
| **Safest fix** | Use `Math.min(pricePad, formatted.length)` or increase `pricePad` to 10 and reduce `nameW` accordingly. |

---

### 🟡 BUG 6 — LOW: `capacitor.ts` defines a dead `PrinterService` interface

| Field | Detail |
|-------|--------|
| **File** | `frontend/src/capacitor.ts:23-31` |
| **Issue** | Defines a `PrinterService` interface and `PreviewPrinter` stub class. These are never imported or used anywhere. The actual printer service lives in `services/printer/printerService.ts`. This is dead code that creates confusion. |
| **Severity** | 🟡 LOW |
| **Safest fix** | Remove the dead interface from `capacitor.ts`. |

---

### 🟡 BUG 7 — LOW: CORS wildcard on print agent

| Field | Detail |
|-------|--------|
| **File** | `usb-print-agent/server.js:11` |
| **Issue** | `cors({ origin: '*' })` allows any browser tab on the machine to POST to the agent and trigger printing. In a shared-machine or browser-based attack scenario, this is a vulnerability. |
| **Severity** | 🟡 LOW (mitigated by loopback binding) |
| **Safest fix** | Change to `cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] })`. |

---

### 🟡 NOTE: `window.location.href` for RawBT may navigate away from the WebView

| Field | Detail |
|-------|--------|
| **File** | `AndroidPrinterAdapter.ts:6` |
| **Issue** | Using `window.location.href` to fire an Android intent navigates the WebView's history. On some Capacitor versions, this can cause a brief blank-screen flash or back-navigation issue. |
| **Severity** | 🟡 LOW (cosmetic) |
| **Safest fix** | Use an `<a href="rawbt:...">` click approach or Capacitor's `App.openUrl()` if available. |

---

## 19. EXACT MINIMUM CHANGES NEEDED (IF ANY)

**In priority order — none implemented in this audit:**

1. 🔴 **Wire thermal print into `Billing.tsx`** (mobile checkout): Add `printerService.printOrder()` call in `onSuccess`.
2. 🔴 **Fix `AndroidPrinterAdapter` false-positive success**: Return `false` on any exception; consider adding a user-visible error state.
3. 🟠 **Fix USB path success reporting**: Either wait for `lp` completion before responding, or use async job tracking.
4. 🟠 **Specify CUPS printer explicitly**: Add `PRINTER_NAME` env var and `-d` flag to `lp` command.
5. 🟡 **Fix large-total column overflow**: Increase price column padding or clamp.
6. 🟡 **Restrict CORS to known origins**.
7. 🟡 **Remove dead `PrinterService` stub in `capacitor.ts`**.

---

*End of forensic audit. Zero files were modified during this investigation.*
