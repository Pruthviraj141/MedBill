STEP 4A — BUILD A REAL PERFORMANCE DIAGNOSTIC / BOTTLENECK TEST

DO NOT OPTIMIZE OR REFACTOR ANYTHING IN THIS STEP.

The application is currently working correctly. I do NOT want architectural changes yet.

I want a diagnostic tool that tells us the REAL source of the slowness before we make this production-ready.

The goal is to answer with evidence:

IS THE DELAY CAUSED BY:
1. Frontend / React rendering
2. Browser / Capacitor initialization
3. Internet/network latency
4. Cloudflare Worker request latency
5. Hono routing/middleware
6. MongoDB connection establishment
7. MongoDB query execution
8. Too many API requests
9. Large API payloads
10. React Query refetching
11. React component rerenders
12. Some combination of the above

==================================================
1. DO NOT CHANGE PRODUCT CODE
==================================================

Do not modify:
- business logic
- database schema
- frontend UI
- API behavior
- invoice numbering
- authentication
- Dashboard design
- Billing design

You may add temporary diagnostic instrumentation/scripts only.

After testing, the diagnostic instrumentation should be easy to remove.

==================================================
2. CREATE ONE PERFORMANCE TEST TOOL
==================================================

Create a single clear diagnostic tool/script that can be run with one command.

For example:

npm run perf:diagnose

The exact implementation can be chosen based on the current project structure.

It must test the REAL deployed API, not a fake/mock server.

Use the current API base URL from the environment/configuration.

Do NOT hardcode secrets.

==================================================
3. TEST THE API END-TO-END
==================================================

Measure at minimum:

A. GET /api/health

B. POST /api/auth/login

C. GET /api/products

D. GET /api/orders

E. GET /api/reports/today

F. GET /api/reports/week

G. GET /api/reports/month

For each endpoint run multiple warm requests.

Also identify initial/cold behavior where possible.

Record:

- DNS/connect latency if measurable
- total request duration
- response status
- response size
- number of requests
- average
- minimum
- maximum
- p50
- p95

Do NOT invent values.

==================================================
4. SEPARATE NETWORK TIME FROM SERVER TIME
==================================================

This is extremely important.

Use the response timing headers / Server-Timing if available.

If server-side timing information does not currently exist, temporarily add diagnostic timing headers in the backend.

Example concept:

Server-Timing:
middleware;dur=...
db;dur=...
handler;dur=...
total;dur=...

Only add diagnostic instrumentation.

Do not change normal response behavior.

The diagnostic output should help distinguish:

CLIENT → CLOUDFLARE
from
CLOUDFLARE/HONO → MONGODB
from
MONGODB QUERY TIME

If Cloudflare timing cannot be isolated exactly, say so.

==================================================
5. MEASURE MONGODB INTERNALLY
==================================================

For the major endpoints, temporarily measure:

- time before MongoDB operation
- time after MongoDB operation

For example:

products query duration
orders query duration
report aggregation duration
counter update duration
order insert duration

For POST /orders specifically, break the timing down into:

idempotency lookup
product lookup
invoice counter
order insert
total server processing

Return these measurements ONLY through diagnostic logging/headers or the diagnostic tool.

Do NOT expose sensitive information to the normal frontend.

==================================================
6. TEST POST /ORDERS
==================================================

This is critical.

Do NOT create normal fake café orders repeatedly.

Use a clearly identifiable temporary diagnostic order.

Use something like:

hardwareId/deviceId:
perf-diagnostic

and a unique idempotency key such as:

perf-diagnostic-<timestamp>-<random>

Create a valid temporary test order.

Measure:

- complete HTTP time
- idempotency lookup
- product lookup
- invoice counter
- order insert
- total server time

Clean up the diagnostic records safely afterward without affecting normal café history.

DO NOT change invoice numbering behavior permanently.

If creating test orders could interfere with the current temporary database, clearly explain how the test avoids that.

==================================================
7. TEST DIRECT MONGODB TIMING
==================================================

Where safe and possible, add a diagnostic operation that measures the database independently from the public API.

Measure simple operations such as:

- ping
- product find
- order find
- report aggregation

This allows comparison:

DIRECT MONGODB
vs
CLOUDFLARE WORKER → MONGODB

This is important to determine whether the network path is the real bottleneck.

Do not expose MongoDB credentials or connection strings in output.

==================================================
8. FRONTEND DIAGNOSTIC
==================================================

Create a temporary diagnostic page or developer-only diagnostic mode if needed.

Measure actual browser behavior for:

1. App startup
2. Billing initial render
3. Products becoming visible
4. Dashboard becoming usable
5. Orders becoming usable

Also track:

- API requests made during startup
- duplicate requests
- API request duration
- JS execution time where possible
- long tasks
- largest content/render timing where possible

Use browser Performance APIs where useful.

DO NOT modify the visual UI.

==================================================
9. REACT QUERY REQUEST AUDIT
==================================================

Inspect and instrument the existing React Query behavior.

For each active query record:

query key
fetch count
fetch start
fetch end
reason for refetch if identifiable

Specifically determine whether any of these happen more than once unnecessarily:

App startup → products
Dashboard open → reports
Orders open → orders
Checkout → products
Checkout → reports
Checkout → orders

Produce an actual request timeline.

==================================================
10. CART INTERACTION TEST
==================================================

This distinguishes frontend lag from backend lag.

Measure:

- product tap → cart update
- quantity + → cart update
- quantity - → cart update

Confirm whether ANY network request occurs during these actions.

If there are no API requests but the interaction is still slow, investigate React rendering/main-thread work instead.

Do not optimize it yet. Only diagnose.

==================================================
11. CAPACITOR / ANDROID TEST
==================================================

If the existing Android project is available, provide a way to run the same diagnostic against the real Capacitor app.

Compare:

BROWSER
vs
ANDROID CAPACITOR

for:

- startup
- products API
- reports API
- orders API

This helps determine whether the WebView itself contributes to the delay.

If exact Android instrumentation is not practical, clearly state the limitation.

==================================================
12. RUN MULTIPLE TESTS
==================================================

Do not rely on one request.

For each API request, run enough repetitions to identify variability.

Separate:

COLD / INITIAL
WARM

Do not confuse the first request with normal steady-state performance.

==================================================
13. FINAL DIAGNOSTIC REPORT
==================================================

The script must output a clear report like:

========================================
CAFE POS PERFORMANCE DIAGNOSTIC
========================================

API:
Health .............  XX ms
Products ........... XX ms
Orders ............. XX ms
Reports Today ...... XX ms
Reports Week ....... XX ms
Reports Month ...... XX ms
Login .............. XX ms

POST /orders:
Total .............. XX ms
Idempotency ........ XX ms
Products ........... XX ms
Counter ............ XX ms
Insert ............. XX ms

MongoDB:
Ping ............... XX ms
Product query ...... XX ms
Order query ........ XX ms
Report aggregation . XX ms

Frontend:
Startup ............ XX ms
Billing ready ...... XX ms
Dashboard ready .... XX ms

Requests:
Startup requests ... X
Billing requests ... X
Dashboard requests . X
Checkout requests .. X

========================================
BOTTLENECK ANALYSIS
========================================

Classify the result as:

PRIMARY BOTTLENECK:
- Frontend
- Network
- Cloudflare Worker
- Hono/middleware
- MongoDB connection
- MongoDB query
- Excess API requests
- React rendering
- Mixed

SECONDARY BOTTLENECK:
...

CONFIDENCE:
High / Medium / Low

EVIDENCE:
Explain exactly which measurements support the conclusion.

========================================
RECOMMENDATION
========================================

Give only the next 1–3 changes that are justified by the measurements.

DO NOT make those changes automatically.

==================================================
14. VERY IMPORTANT
==================================================

Do NOT conclude:

"Cloudflare is slow"
"Hono is slow"
"MongoDB is slow"
"React is slow"

without measurement.

I want evidence.

Do NOT report generic advice.

Do NOT claim percentages such as:
"50% faster"
"10x faster"
"85% improvement"

unless the test actually measured before/after performance.

The purpose of this step is diagnosis ONLY.

Do not optimize after finding the problem.
Stop after generating the diagnostic report.