export const getApiBaseUrl = () => {
    const url = import.meta.env?.VITE_API_BASE_URL;
    if (!url) {
        throw new Error("VITE_API_BASE_URL is missing. Please configure it explicitly.");
    }
    return url;
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
    },

    delete: async (endpoint: string) => {
        const url = `${getApiBaseUrl()}${endpoint}`;
        const res = await fetch(url, {
            method: 'DELETE'
        });
        if (!res.ok) {
            throw new Error(`API DELETE Error: ${res.status} ${res.statusText}`);
        }
        return res.json();
    }
};
