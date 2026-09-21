# Local Development Workflow

Follow these precise steps to safely sandbox code interactions on your local machine before pushing to GitHub.

## Base Prerequisites
- Node.js `v20+` (Preferred)
- `npm` or `yarn`
- Android Studio / Android SDK (Only if compiling APK manually)
- Capacitor CLI

---

## Running Local Development

We intentionally maintain a fully functional "Web Simulator" mode that hooks standard networks for UI development, bypassing the strict Native Android `SQLite` demands safely.

You no longer need to run a local Cloudflare worker loop for most UI development.

### 1. Launch the Vite UI Hot-Reload Server
This is all you need to spin up the local development dashboard:
```bash
cd frontend
npm install
npm run dev
```

### 2. Emulate Local Development Configurations
To ensure your frontend correctly maps to the live remote API, verify your `.env` specifies:
`VITE_API_BASE_URL=https://cafe-pos-api.pruthvigavhane.workers.dev/api`

## Running Standard Validations
### TypeScript Typings Check
```bash
cd frontend
npm run typecheck
```

### Production Bundling Assessment
```bash
cd frontend
npm run build
```

## Important Distinction: Local vs Production
- **Local Development** (Browser) fetches strictly from configurations resolving to `127.0.0.1`.
- **Production API** (Capacitor/Native) maps strictly through `/api` routes targeting `https://cafe-pos-api.pruthvigavhane.workers.dev/api`.

**Do not hardcode `http://localhost` into raw fetch modules**, rely entirely on `import.meta.env.VITE_API_BASE_URL` to prevent breaking the APK's networking domain bounds.
