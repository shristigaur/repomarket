import { useEffect, useState } from 'react';
import { API_BASE_URL, apiFetch } from './api';

export { API_BASE_URL, API_URL } from './api';
export function authHeaders() {
  // Authentication is cookie-based; never add browser-managed bearer tokens.
  return {};
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/auth/me')
      .then((response) => response.ok ? response.json() : null)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  function signOut() {
    apiFetch('/auth/logout', { method: 'POST' })
      .finally(() => {
        setUser(null);
        window.location.href = '/';
      });
  }

  return { user, loading, signOut };
}
