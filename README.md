# MedBill Pharmacy POS

A modern, offline-first Point of Sale (POS) system engineered for retail pharmacies, medical dispensaries, and clinics. 

MedBill guarantees uninterrupted billing operations on Android mobile terminals, tablets, and desktop workstations regardless of network connectivity. Powered by local native SQLite persistence coupled with high-speed edge synchronization to Cloudflare Workers and D1 database.

---

## Key Capabilities

- **100% Offline-First Billing**: Complete cash and UPI billing workflows continue uninterrupted without an active internet connection.
- **Medicine Dosage Schedules**: Interactive Morning (**M**), Afternoon (**A**), and Night (**N**) dosage toggles (e.g. `1-0-1`) per medicine item, tracked in database orders.
- **58mm Thermal Receipt Printing**: Formats ESC/POS receipts with clean medicine rows, bold dosage schedules, and QR codes via USB or Bluetooth.
- **Virtual Print Preview**: Integrated live thermal receipt preview available locally at `http://127.0.0.1:28080/preview`.
- **Edge Data Synchronization**: Automatic background synchronization queue reconciling local offline SQLite transactions with Cloudflare D1.
- **Real-Time Pharmacy Analytics**: Tracks revenue, bill averages, top dispensed medicines, weekday sales trends, and peak hour distributions with `Today`, `7D`, `30D`, and `All Time` filters.
- **Responsive Hybrid Interface**: Seamless automatic switching between Mobile Touch layout and Desktop Multi-Pane workstation.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **State & Cache** | Zustand, TanStack React Query |
| **Mobile Runtime** | Capacitor 8 (Android API 35) |
| **Local Storage** | Capacitor Native SQLite (`@capacitor-community/sqlite`) |
| **Edge Backend** | Cloudflare Workers, Hono framework |
| **Cloud Database** | Cloudflare D1 (Serverless Distributed SQL) |
| **Thermal Printing** | ESC/POS standard buffer, USB Print Agent (`usb-print-agent`) |

---

## Project Structure

```text
├── frontend/           # React 19 application & Capacitor Android wrapper
│   ├── src/
│   │   ├── app/        # App shell & responsive layout controller
│   │   ├── features/   # Billing, Dashboard, Orders, Products, Desktop POS
│   │   ├── db/         # SQLite engine, migrations, catalog seed data
│   │   ├── services/   # Checkout, sync, thermal printer pipeline
│   │   └── stores/     # Cart & theme state stores
│   └── android/        # Native Android project configuration
├── backend/            # Cloudflare Worker APIs & D1 database migrations
│   ├── src/routes/     # Orders, products, sync, reports endpoints
│   └── migrations/     # Cloudflare D1 schema & performance indexes
├── usb-print-agent/    # Local print daemon & 58mm virtual receipt server
├── windows-release/    # Windows standalone POS launcher & bundle
└── docs/               # Technical architecture & deployment guides
```

---

## Quick Start

### 1. Frontend Development
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.  
To view the mobile layout on desktop, visit [http://localhost:5173/?mode=mobile](http://localhost:5173/?mode=mobile) or toggle Chrome Device Mode (`Ctrl+Shift+M`).

### 2. Virtual Thermal Print Agent
```bash
# Starts local ESC/POS print agent on port 28080
PRINTER_MODE=virtual node usb-print-agent/server.js
```
Preview rendered receipts in real time at [http://127.0.0.1:28080/preview](http://127.0.0.1:28080/preview).

### 3. Cloudflare Edge Backend
```bash
cd backend
npm install
npm run dev
```

---

## Android Build (Capacitor)

```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```

---

## Documentation

- [Architecture & Data Pipeline](docs/ARCHITECTURE.md)
- [Database Schema & Migrations](docs/DATABASE.md)
- [Cloud Synchronization Logic](docs/SYNC.md)
- [API Specifications](docs/API.md)
- [Android Setup & Build](docs/ANDROID.md)
- [Production Deployment](docs/DEPLOYMENT.md)

---

## License

Private and proprietary. Developed for MedBill Pharmacy POS.
