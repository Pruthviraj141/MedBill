BACKEND DB PERFORMANCE - PHASE 2 (does not touch auth, hosting, or UI)

CONTEXT: Idempotency key, missing indexes, and waitUntil-based background writes are already done (previous pass). This is additional, separate DB/query-level speed work. Do not redo those.

DO NOT change auth logic, UI, or hosting/deploy target in this pass.

==================================================
FIX 1 - COMBINE DASHBOARD/REPORT QUERIES WITH $facet
==================================================

Inspect backend/src/routes/reports.ts. If the summary/dashboard endpoint currently runs multiple separate aggregation queries (e.g. revenue totals, top products, payment mix as separate `.aggregate()` calls), combine what's reasonable into a single aggregation using MongoDB's `$facet` stage, so one round trip to Atlas returns all of it:

db.collection('orders').aggregate([
  { $match: { cafeId, createdAt: { $gte: startDate } } },
  { $facet: {
      revenueTotals: [ /* existing revenue/orders/avgBill pipeline */ ],
      topProducts: [ /* existing top products pipeline */ ],
      paymentMix: [ /* existing payment mix pipeline */ ],
  } }
])

Only combine pipelines that already share the same $match stage (same cafeId/date range). Keep pipelines that need a different collection or filter separate. Do not change what data is returned to the frontend - only how many round trips it takes to get it.

==================================================
FIX 2 - PARALLELIZE INDEPENDENT CHECKOUT STEPS
==================================================

In the checkout route (orders.ts), the current flow is: idempotency check -> product lookup -> invoice counter -> insert order -> stock bulkwrite.

The idempotency check must run first and short-circuit if it's a duplicate. After that, inspect whether the product lookup and invoice counter increment are actually independent of each other (neither needs the other's result). If so, run them together:

const [products, invoiceNumber] = await Promise.all([
  lookupProducts(cartItems),
  getNextInvoiceNumber(cafeId),
])

Do not parallelize steps that genuinely depend on a prior step's output (e.g. inserting the order needs the invoice number and validated products first).

==================================================
FIX 3 - SHORT-TTL EDGE CACHE FOR THE DASHBOARD REPORT
==================================================

Cache the dashboard/report GET response for 30-60 seconds using Cloudflare's built-in Cache API (no new dependency, no cost):

const cacheKey = new Request(c.req.url, c.req.raw)
const cache = caches.default
let response = await cache.match(cacheKey)
if (!response) {
  const data = await getReportData(...)
  response = c.json(data)
  response.headers.set('Cache-Control', 'public, max-age=45')
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()))
}
return response

Only apply this to read-only report/dashboard GET endpoints - never to checkout, login, or anything that writes data. Vary the cache key by cafeId/period query params so different cafes/periods don't collide.

==================================================
FIX 4 - TRIM QUERY PROJECTIONS
==================================================

For the recent-orders preview and product list endpoints, check whether the query fetches full documents when only a few fields are displayed (e.g. full item arrays for a list that only shows total + item count). Add a MongoDB projection to fetch only the fields actually used in the response:

.find({ cafeId }, { projection: { total: 1, itemCount: 1, createdAt: 1, paymentMethod: 1 } })

Do not remove fields that are genuinely used elsewhere (e.g. the full Orders detail view still needs full documents - only trim the lightweight preview/list endpoints).

==================================================
DEFINITION OF DONE
==================================================
- [ ] Dashboard/report endpoint makes fewer round trips to Mongo than before (verify by checking query logs or Atlas performance tab).
- [ ] Checkout latency improves slightly from Fix 2, with identical order/invoice correctness.
- [ ] Repeat dashboard loads within ~45s return from cache, not a fresh Mongo query.
- [ ] Recent-orders/product-list responses are smaller (check network tab payload size) with no missing data on screens that need full detail.
- [ ] auth.ts, UI, and hosting are untouched. `npm run build` passes with no errors.
