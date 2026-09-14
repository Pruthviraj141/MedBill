# Local Development Workflow

Follow these precise steps to safely sandbox code interactions on your local machine before pushing to GitHub.

## Base Prerequisites
- Node.js `v20+` (Preferred)
- `npm` or `yarn`
- Android Studio / Android SDK (Only if compiling APK manually)
- Capacitor CLI

---

## Running in the Web Simulator (Browser Development)

We intentionally maintain a fully functional "Web Simulator" mode that hooks standard HTTPS proxies for UI development, bypassing the strict Native Android `SQLite` demands safely.

### 1. Launch the Cloudflare Development API (Terminal A)
All local UI queries must terminate against a sandboxed `wrangler` micro-server.
```bash
cd backend
npm install
npm run dev
```
*Note: This binds a local node listener dynamically routing to your Cloudflare development credentials under `http://127.0.0.1:8787`.*

### 2. Launch the Vite UI Hot-Reload Server (Terminal B)
```bash
cd frontend
npm install
npm run dev
```

### 3. Emulate Local Development Configurations
To ensure your frontend targets your Local D1 Worker instead of Production Edge nodes, verify your `frontend/.env.development` or native shell arguments correctly bind to:
`VITE_API_BASE_URL=http://127.0.0.1:8787/api`

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
