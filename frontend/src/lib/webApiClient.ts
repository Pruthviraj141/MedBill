// Helper for Browser Development Data Mode
export const getApiBaseUrl = () => {
    return import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8787/api';
};

export const webApiClient = {
    get: async (endpoint: string) => {
        const url = `${getApiBaseUrl()}${endpoint}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`API GET Error: ${res.status} ${res.statusText}`);
        }
        return res.json();
    },

    post: async (endpoint: string, data: any) => {
        const url = `${getApiBaseUrl()}${endpoint}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            throw new Error(`API POST Error: ${res.status} ${res.statusText}`);
        }
        return res.json();
    }
};
