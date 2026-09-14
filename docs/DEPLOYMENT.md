# Deployment Guide

The deployment paradigm partitions deployments, decoupling mobile compilation from cloud configurations.

## Backend Deployments (Cloudflare)
Cloud boundaries execute via simple standard internal `wrangler` CLI commands targeting production seamlessly:
```bash
cd backend
npm run deploy
```

Any modification touching `schema.sql` explicitly triggers standard Cloudflare DB execution workflows:
```bash
npx wrangler d1 execute tbt-cafe-prod --remote --file=./migrations/0001_init.sql
```
*(Verify exact IDs matching standard `wrangler.toml` parameters)*

## Frontend / Mobile Deployment
Compile bundles to deploy standard Native output definitions:
1. Confirm Environment variable boundaries accurately target your explicit `cafe-pos-api` worker logic:
   `VITE_API_BASE_URL=https://cafe-pos-api.pruthvigavhane.workers.dev/api`
2. Sync natively:
   `npm run build && npx cap sync android`
3. Generate the application via Android Studio or `./gradlew assembleDebug`.
