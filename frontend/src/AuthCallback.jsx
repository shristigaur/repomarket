import React, { useEffect } from 'react';

export default function AuthCallback() {
  useEffect(() => {
    window.location.replace('/');
  }, []);

  return <main className="grid min-h-screen place-items-center bg-paper font-mono text-xs uppercase tracking-[.1em] text-moss">Signing you in...</main>;
}
