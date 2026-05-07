const API_URL = import.meta.env.VITE_API_URL || '/api';

class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include', // Importante para cookies httpOnly
      });

      // Si es 401, no reintentar
      if (response.status === 401) {
        throw new APIError('No autenticado', 401);
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new APIError(
          data.error || `Error ${response.status}`,
          response.status,
          data
        );
      }

      return await response.json();
    } catch (error) {
      lastError = error;

      // No reintentar errores de autenticación o del cliente
      if (error.status === 401 || (error.status >= 400 && error.status < 500)) {
        throw error;
      }

      // Esperar antes de reintentar (exponential backoff)
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
}

export const api = {
  // Autenticación
  auth: {
    login: async (password) => {
      return fetchWithRetry(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
    },

    logout: async () => {
      return fetchWithRetry(`${API_URL}/auth/logout`, {
        method: 'POST',
      });
    },

    verify: async () => {
      return fetchWithRetry(`${API_URL}/auth/verify`);
    },
  },

  // Leads
  leads: {
    getAll: async (params = {}, nocodbToken = '') => {
      const searchParams = new URLSearchParams();

      if (params.limit) searchParams.set('limit', params.limit);
      if (params.sort) searchParams.set('sort', params.sort);
      if (params.where) searchParams.set('where', params.where);
      if (params.offset) searchParams.set('offset', params.offset);

      const queryString = searchParams.toString();
      const url = `${API_URL}/leads${queryString ? `?${queryString}` : ''}`;
      const headers = nocodbToken ? { 'x-nocodb-token': nocodbToken } : {};

      return fetchWithRetry(url, { headers });
    },
  },
};

export { APIError };
export default api;
