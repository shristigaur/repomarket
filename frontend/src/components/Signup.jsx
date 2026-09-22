import React from 'react';
import { GitBranch } from 'lucide-react';
import { API_URL } from '../api';

export default function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-moss mb-2">RepoMarket</h1>
          <p className="text-[#7b837b]">Create your account</p>
        </div>

        <div className="space-y-3">
          <a
            href={`${API_URL}/api/auth/google`}
            className="w-full flex items-center justify-center gap-2 border border-[#cbd1c8] px-4 py-3 rounded-lg text-moss font-medium transition hover:bg-sage"
          >
            <span className="font-bold text-lg">G</span>
            Sign up with Google
          </a>
          <a
            href={`${API_URL}/api/auth/github`}
            className="w-full flex items-center justify-center gap-2 border border-[#cbd1c8] px-4 py-3 rounded-lg text-moss font-medium transition hover:bg-sage"
          >
            <GitBranch size={18} />
            Sign up with GitHub
          </a>
        </div>

        <p className="text-center text-sm text-[#7b837b] mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-coral font-medium hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
