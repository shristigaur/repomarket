// Keep the backend origin in an environment variable; secrets never belong in Vite variables.
export const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL must be set to the backend origin.');
}

export const API_BASE_URL = `${API_URL.replace(/\/$/, '')}/api`;

// Every API request sends the httpOnly authentication cookie. JavaScript cannot read it.
export function apiFetch(path, options = {}) {
  return fetch(`${API_BASE_URL}${path}`, { ...options, credentials: 'include' });
}
