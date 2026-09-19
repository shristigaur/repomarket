import React, { useEffect } from 'react';

export default function AuthCallback() {
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) localStorage.setItem('repomarket_token', token);
    window.location.replace('/');
  }, []);

  return <main className="grid min-h-screen place-items-center bg-paper font-mono text-xs uppercase tracking-[.1em] text-moss">Signing you in...</main>;
}
