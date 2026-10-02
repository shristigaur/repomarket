// Vercel supplies VITE_API_URL; the fallback keeps preview builds usable.
export const API_URL = (import.meta.env.VITE_API_URL || 'https://repomarket.onrender.com').replace(/\/$/, '');
export const API_BASE_URL = `${API_URL}/api`;

// Every API request sends the httpOnly authentication cookie. JavaScript cannot read it.
export function apiFetch(path, options = {}) {
  return fetch(`${API_BASE_URL}${path}`, { ...options, credentials: 'include' });
}
