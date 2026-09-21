# Troubleshooting & Common Gotchas

## 1. App Startup Delay / Blank Billing View
**Symptom**: Opening the application displays an empty menu dynamically.
**Cause**: Original logic parsed explicitly blocking UI wait screens properly tracking full async sync API triggers.
**Fix Implemented**: The App now natively statically evaluates exactly precise `defaultCatalog` lists dynamically pre-loading baseline products. This guarantees Billing views never delay displaying visually due to network buffering dynamically.

## 2. Invisible Dashboard Refresh Icons (Theme Mismatch)
**Symptom**: Dashboard icons identically natively fade into the background on light theme, rendering them invisible.
**Fix**: `Dashboard.tsx` cleanly adjusts the icon contrast relative to the background theme using standard Tailwind modifiers (`text-white/90` vs `#EAD6C0`), ensuring perfect visibility.

## 3. SQLite D1 Misconfiguration
**Symptom**: Migrations fail to apply dynamically cleanly when D1 schemas differ from local SQLite expectations.
**Fix**: Ensure `schema.sql` and `migrations.ts` are identical structurally. Deploy backend explicitly and wipe local Android caches securely when testing.
