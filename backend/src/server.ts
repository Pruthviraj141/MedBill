import { serve } from '@hono/node-server';
import app from './index';
import * as dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

dotenv.config();

// Attempt to load .dev.vars securely for backward Cloudflare compatibility
const devVarsPath = resolve(process.cwd(), '.dev.vars');
if (existsSync(devVarsPath)) {
  const devVars = dotenv.parse(readFileSync(devVarsPath));
  for (const k in devVars) {
    if (!process.env[k]) process.env[k] = devVars[k];
  }
}

// Inject Node process.env seamlessly into Hono context
app.use('*', async (c, next) => {
  c.env = process.env;
  await next();
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 8787;

console.log(`\n✅ Café POS Production Node Server running at http://0.0.0.0:${port}`);
serve({ fetch: app.fetch, port });
