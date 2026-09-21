# TBT Cafe POS

A modern, offline-first Point of Sale (POS) system engineered specifically for TBT Cafe. 

The application is built on a highly resilient mobile topology that ensures seamless billing operations on Android tablets regardless of active internet connectivity, utilizing an isolated Native SQLite transaction engine coupled with background synchronization to Cloudflare edge networks.

## Key Capabilities
- **100% Offline-First Operations**: Cafe operations never halt. Taking cash/UPI orders works permanently offline without internet connections.
- **Native Data Engine**: Direct, ultra-low latency hardware bindings to Android's built-in SQLite engine, bypassing browser-based database limits.
- **Background Synchronization**: Background daemons elegantly resolve queue mismatches and upload telemetry to the cloud implicitly whenever cell coverage returns. 
- **Cloud-Synced Master Catalog**: Product updates flow automatically from the cloud database downwards to all connected terminals.
- **Advanced Real-time Analytics**: Tracks peak hours, sales items, and revenue matrix charts locally.

## Architecture Pipeline
- **Frontend Container**: React + Vite + Capacitor (Android 35).
- **Frontend Storage Engine**: Capacitor Native SQLite (`@capacitor-community/sqlite`).
- **Backend Edge Network**: Cloudflare Worker APIs via Hono.
- **Cloud Source of Truth**: Cloudflare D1 Serverless SQL.

*(See [ARCHITECTURE](docs/ARCHITECTURE.md) for deeper insight)*

## Repository Structure
- `/frontend`: The core React web app and Capacitor configurations.
- `/backend`: The Hono API layer, Cloudflare deployment configurations, and D1 database commands.
- `/docs`: Specialized developer resources and environment troubleshooting.

*(See [PROJECT STRUCTURE](docs/PROJECT_STRUCTURE.md) for directory maps)*

## Environment Setup & Development
For detailed instructions encompassing Node layouts, API definitions, testing, and production Worker integration:
- See the [DEVELOPMENT.md](docs/DEVELOPMENT.md) guide to spin up the local UI targeting the real Cloudflare Edge Network.
- See the [ANDROID.md](docs/ANDROID.md) guide for compiling the Capacitor Sandbox APK.

## Technical Documentation
Please reference our technical manuals before modifying state or pipeline configurations:
- [Data Storage & Schemas](docs/DATABASE.md)
- [Synchronization Logic](docs/SYNC.md)
- [Worker API Routes](docs/API.md)
- [Production Deployment](docs/DEPLOYMENT.md)
- [Troubleshooting & Gotchas](docs/TROUBLESHOOTING.md)
