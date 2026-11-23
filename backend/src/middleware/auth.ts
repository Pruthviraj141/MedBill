import { jwt } from 'hono/jwt';
import type { Context, Next } from 'hono';
import { startTime, endTime } from 'hono/timing';

export type Role = 'ADMIN' | 'CASHIER' | 'MANAGER' | string;

export const authMiddleware = () => {
  return async (c: Context, next: Next) => {
    startTime(c, 'auth_middleware');
    const secret = c.env.AUTH_SECRET || 'changeme_to_secure_secret';
    
    const jwtMiddleware = jwt({
      secret: secret,
      alg: 'HS256'
    });
    const res = await jwtMiddleware(c, next);
    endTime(c, 'auth_middleware');
    return res;
  };
};

export const requireRole = (allowedRoles: Role[]) => {
  return async (c: Context, next: Next) => {
    const payload = c.get('jwtPayload') as any;
    if (!payload || !payload.role || !allowedRoles.includes(payload.role as Role)) {
      return c.json({ ok: false, error: 'Unauthorized role access' }, 403);
    }
    await next();
  };
};
