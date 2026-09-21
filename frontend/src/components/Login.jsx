import React, { useState } from 'react';
import { GitBranch, Mail, Lock, Loader } from 'lucide-react';
import { API_URL, apiFetch } from '../api';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-moss mb-2">RepoMarket</h1>
          <p className="text-[#7b837b]">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-moss mb-2">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3 text-[#cbd1c8]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-[#cbd1c8] rounded-lg focus:border-coral focus:ring-2 focus:ring-coral/15 outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-moss mb-2">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-[#cbd1c8]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-[#cbd1c8] rounded-lg focus:border-coral focus:ring-2 focus:ring-coral/15 outline-none transition"
                required
              />
            </div>
          </div>

          {error && <div className="bg-[#f5ddd4] text-[#8b3d2b] px-4 py-3 rounded-lg text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-moss text-paper py-2.5 rounded-lg font-medium transition hover:bg-[#285844] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader size={18} className="animate-spin" />}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#d8d9d0]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-paper text-[#7b837b]">Or continue with</span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <a
            href={`${API_URL}/api/auth/google`}
            className="w-full flex items-center justify-center gap-2 border border-[#cbd1c8] px-4 py-2.5 rounded-lg text-moss font-medium transition hover:bg-sage"
          >
            <span className="font-bold">G</span>
            Google
          </a>
          <a
            href={`${API_URL}/api/auth/github`}
            className="w-full flex items-center justify-center gap-2 border border-[#cbd1c8] px-4 py-2.5 rounded-lg text-moss font-medium transition hover:bg-sage"
          >
            <GitBranch size={18} />
            GitHub
          </a>
        </div>

        <p className="text-center text-sm text-[#7b837b]">
          Don't have an account?{' '}
          <a href="/signup" className="text-coral font-medium hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
