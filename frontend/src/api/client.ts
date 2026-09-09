const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function handleUnauthorized(status: number) {
  if (status === 401) {
    localStorage.removeItem('auth_token');
    window.dispatchEvent(new Event('auth-expired'));
  }
}

function getHeaders() {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, { headers: getHeaders() });
    
    let json: any = {};
    try { json = await res.json(); } catch(e) {}

    handleUnauthorized(res.status);

    if (!res.ok || json.success === false) {
      throw new Error(json?.error?.message || json?.error || `API error: ${res.status}`);
    }
    
    return json.data !== undefined ? json.data : json;
  },

  async post<T>(path: string, body: any): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    
    let json: any = {};
    try { json = await res.json(); } catch(e) {}

    handleUnauthorized(res.status);

    if (!res.ok || json.success === false) {
      throw new Error(json?.error?.message || json?.error || `API error: ${res.status}`);
    }
    
    return json.data !== undefined ? json.data : json;
  },
};
