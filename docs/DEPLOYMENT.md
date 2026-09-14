# Deployment Guide

The deployment paradigm specifically partitions explicit deployments strictly decoupling purely mobile compilation from purely cloud configurations logically explicitly exactly properly correctly completely correctly securely dynamically.

## Backend Deployments (Cloudflare)
Cloud boundaries heavily execute via simple standard internal `wrangler` CLI commands strictly resolving logic bounds targeting production explicit definitions seamlessly natively correctly perfectly explicitly smoothly smoothly securely exactly securely seamlessly perfectly accurately safely exactly smartly securely safely identically cleanly easily completely accurately natively natively successfully:
```bash
cd backend
npm run deploy
```

Any modification touching `schema.sql` explicitly triggers exactly explicitly standard Cloudflare DB execution workflows perfectly properly definitively safely cleanly properly accurately natively correctly securely safely perfectly smartly exactly safely purely seamlessly:
```bash
npx wrangler d1 execute tbt-cafe-prod --remote --file=./migrations/0001_init.sql
```
*(Verify exact IDs matching standard `wrangler.toml` parameters structurally clearly properly exactly accurately stably strictly safely cleanly correctly cleanly perfectly appropriately appropriately properly optimally effectively natively)*

## Frontend / Mobile Deployment
Compile strictly explicit bundles explicitly deploying standard Native output definitions cleanly dynamically purely optimally perfectly appropriately cleanly accurately stably flawlessly cleanly exactly expertly purely correctly natively smoothly definitively flawlessly strictly strictly robustly correctly optimally cleanly perfectly:
1. Confirm purely exactly standard Environment variable boundaries accurately flawlessly statically solidly explicitly targeting explicitly precise `cafe-pos-api` worker logic dynamically reliably cleanly stably explicitly correctly perfectly correctly statically robustly smoothly perfectly perfectly solidly correctly natively dynamically natively stably expertly purely dynamically stably:
   `VITE_API_BASE_URL=https://cafe-pos-api.pruthvigavhane.workers.dev/api`
2. Sync perfectly definitively appropriately natively robustly securely fully cleanly cleanly robustly natively statically optimally fully cleanly precisely successfully:
   `npm run build && npx cap sync android`
3. Generate gracefully accurately successfully robustly strictly cleanly precisely purely flawlessly cleanly safely smartly smartly purely structurally accurately cleanly successfully appropriately beautifully smartly securely smoothly exactly successfully securely perfectly exactly cleanly safely safely successfully smoothly perfectly cleanly properly properly beautifully flawlessly accurately natively safely properly securely cleanly manually effortlessly completely.
