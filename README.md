# Cafe POS V1

Mobile-first café billing prototype built around the intended production architecture:

- React + Vite + TypeScript
- Capacitor-ready Android shell
- Hono backend (Cloudflare Workers)
- MongoDB Atlas integration boundary
- Local-first storage abstraction (browser preview uses localStorage; Android can swap in Capacitor SQLite)
- Printer service abstraction for Bluetooth/Wi-Fi ESC/POS

## Run the mobile UI preview

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL on desktop or phone.

## Add Capacitor Android later

```bash
cd frontend
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Android Studio is optional for development in principle, but building/native printer integrations may still require Android SDK/Gradle tooling.

## Backend

```bash
cd backend
npm install
npm run dev
```

The backend is intentionally small in V1. Replace the repository layer with MongoDB Atlas calls through the Hono routes.
