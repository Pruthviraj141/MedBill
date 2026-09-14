export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for non-HTTPS local dev environments where crypto.randomUUID is blocked
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}
