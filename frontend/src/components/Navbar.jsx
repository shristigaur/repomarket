import React from 'react';
import { GitBranch, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../auth';
import { API_URL } from '../api';
import OTPVerificationModal from './OTPVerificationModal';

export default function Navbar({ actionHref = '/create', actionLabel = 'List a repository' }) {
  const { user, signOut } = useAuth();

  return <>
    <nav className="border-b border-[#d8d9d0] bg-paper/95 px-[5vw] backdrop-blur">
      <div className="mx-auto flex min-h-[76px] max-w-[1320px] flex-wrap items-center justify-between gap-4 py-3">
        <a className="flex items-center gap-3 font-display text-[17px] font-bold text-ink no-underline" href="/">
          <span className="grid h-[32px] w-[32px] place-items-center bg-moss font-mono text-[13px] text-paper shadow-[3px_3px_0_#dc6f48]">R</span>
          <span>RepoMarket</span>
        </a>
        <div className="flex items-center gap-2 sm:gap-4">
          <a className="hidden border border-moss px-3.5 py-2 font-mono text-[10px] uppercase tracking-[.08em] text-moss transition hover:bg-moss hover:text-paper sm:inline-block" href={actionHref}>{actionLabel} <span aria-hidden="true">-&gt;</span></a>
          {user ? (
            <div className="flex items-center gap-2 border-l border-[#d8d9d0] pl-3">
              <a className="flex items-center gap-2 text-left" href="/my-listings">
                {user.avatar ? <img className="h-8 w-8 rounded-full object-cover" src={user.avatar} alt="" /> : <span className="grid h-8 w-8 place-items-center rounded-full bg-sage text-moss"><UserRound size={15} /></span>}
                <span className="hidden max-w-[120px] truncate font-display text-xs font-semibold text-moss sm:inline">{user.name}</span>
              </a>
              <button className="p-2 text-[#7b837b] transition hover:text-coral" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={15} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a className="flex items-center gap-1.5 border border-[#cbd1c8] px-2.5 py-2 font-mono text-[9px] uppercase tracking-[.05em] text-moss transition hover:border-moss hover:bg-sage" href={`${API_URL}/api/auth/google`}><span className="font-bold">G</span><span className="hidden sm:inline">Sign in with Google</span><span className="sm:hidden">Google</span></a>
              <a className="flex items-center gap-1.5 border border-[#cbd1c8] px-2.5 py-2 font-mono text-[9px] uppercase tracking-[.05em] text-moss transition hover:border-moss hover:bg-sage" href={`${API_URL}/api/auth/github`}><GitBranch size={13} /><span className="hidden sm:inline">Sign in with GitHub</span><span className="sm:hidden">GitHub</span></a>
            </div>
          )}
        </div>
      </div>
    </nav>
    {user && !user.isEmailVerified && <OTPVerificationModal user={user} />}
  </>;
}
