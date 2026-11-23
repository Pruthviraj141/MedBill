# Backend Service

This directory contains the API backend for the Cafe POS application.

## Tech Stack
- **Framework**: Hono with Node and Cloudflare Workers
- **Database**: Cloudflare D1 Serverless Database (medical-pos-db)
- **Validation**: Zod
- **Language**: TypeScript

## Key Commands
- `npm run dev`: Start the Wrangler local development server
- `npm run deploy`: Deploy to Cloudflare Workers
- `npm run seed:products`: Script to migrate/seed products into the DB
