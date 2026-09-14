# Database Architecture

The TBT Core revolves exactly across 5 absolute relational tables. 
The schema structure strictly matches across both the internal `Android Native SQLite` schema and the remote `Cloudflare D1` cloud environments identically to ensure seamless, conflict-free mapping pipelines.

## Global Tables
### 1. `products`
The main menu inventory directory. 
- Primary Key maps to explicit slugified strings (`prod_masala_maggi`). 
- **Ownership Direction**: Cloud-To-Local. Edits should primarily happen against remote Edge logic and trickle downwards to tablets on sync resets.

### 2. `orders`
The holistic POS checkout ledger record.
- Identifies gross metrics (`invoice_number`, `status`, `subtotal`, `total`, `payment_method`).
- Time-coded metadata maps natively to ISO string types for unified consistency across timezones (`created_at`).
- `status`: Strictly constrained via CHECK constraints allowing ONLY `'COMPLETED'` or `'VOIDED'`.

### 3. `order_items`
Individual line item products belonging to a primary `id` from the `orders` ledger.
- Retains crucial **Data Snapshots**: Contains explicit `name_snapshot` strings mapped directly to the checkout moment. Even if a product name drastically changes remotely months later, historical reports parse the literal name dynamically saved identically inside the cart history accurately.

### 4. `settings`
Key-Value static configurations dynamically retained exclusively within local device caches.

### 5. `sync_queue` (Android Exclusivity)
Because Android guarantees offline operability indefinitely, Native SQLite holds the queue tracker.
- Tracks payloads (as stringified JSON arrays).
- Employs strict action triggers (`CREATE` vs `VOID`).
- Maps `PENDING`, `SYNCED`, and `FAILED` backoff counters dynamically resolving sync errors over infinite connectivity durations.

## Money Value Types
**CRITICAL:** Money is exclusively serialized as exact integer digits representing absolute base integers to guarantee mathematical stability and eradicate float-truncation glitches natively (i.e., NO `DECIMAL(10,2)` types). `150` evaluates literally to standard baseline whole denominations universally parsed directly.

## Cloud Sync Pipelines - The Golden Rule
**Orders flow strictly UP.**
A customer walks into the POS terminal. The POS operates physically manipulating native SQL on Android without asking the Cloud for transaction authorization. The resulting order pushes upstream implicitly into the Edge Worker.

**Products flow strictly DOWN.**
To prevent data contamination across numerous distinct retail deployments, product pricing modifications never spawn locally. Product inventory configurations alter Edge records securely parsing downward via exact remote updates directly impacting specific menu boards sequentially.
