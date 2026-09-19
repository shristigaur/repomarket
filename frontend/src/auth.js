import { useEffect, useState } from 'react';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('repomarket_token');
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken() || new URLSearchParams(window.location.search).get('token')));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      localStorage.removeItem('repomarket_token');
      window.history.replaceState({}, document.title, window.location.pathname);
      setUser({ isAuthenticated: true });
    }

    const token = getToken();
    if (!token) {
      setLoading(false);
      return undefined;
    }

    fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : null)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    return undefined;
  }, []);

  function signOut() {
    localStorage.removeItem('token');
    localStorage.removeItem('repomarket_token');
    setUser(null);
  }

  return { user, loading, signOut };
}
