import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Mail, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { API_BASE_URL, authHeaders } from '../auth';

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return <div className={`fixed right-5 top-5 z-[70] flex max-w-[360px] items-start gap-3 border p-4 text-sm shadow-xl ${isSuccess ? 'border-[#b9d2bd] bg-[#d9e9d9] text-[#21563e]' : 'border-[#efc0b1] bg-[#f5ddd4] text-[#8b3d2b]'}`} role="alert"><span className="mt-0.5">{isSuccess ? <CheckCircle2 size={18} /> : <X size={18} />}</span><span className="flex-1 leading-relaxed">{toast.message}</span><button onClick={onClose} aria-label="Dismiss notification"><X size={15} /></button></div>;
}

export default function OTPVerificationModal({ user }) {
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    sendOtp();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = window.setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  async function sendOtp() {
    setSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, { method: 'POST', headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send verification code.');
      setSecondsLeft(60);
      setToast({ type: 'success', message: 'A verification code was sent to your email.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setSending(false);
    }
  }

  async function verifyOtp(event) {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setToast({ type: 'error', message: 'Enter the six-digit verification code.' });
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, otp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to verify code.');
      setToast({ type: 'success', message: 'Email verified. Welcome to RepoMarket.' });
      window.setTimeout(() => window.location.assign('/'), 700);
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setVerifying(false);
    }
  }

  return <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18231f]/75 p-5" role="dialog" aria-modal="true" aria-labelledby="otp-title">
      <form className="w-full max-w-[460px] border border-[#cbd1c8] border-t-4 border-t-coral bg-paper p-7 shadow-2xl sm:p-9" onSubmit={verifyOtp}>
        <div className="flex items-start justify-between gap-5"><div><span className="grid h-11 w-11 place-items-center rounded-full bg-[#d9e9d9] text-[#21563e]"><ShieldCheck size={23} /></span><p className="mt-6 font-mono text-[10px] uppercase tracking-[.1em] text-coral">One last step</p><h2 id="otp-title" className="mt-2 font-display text-3xl font-semibold tracking-[-.05em] text-moss">Verify your email.</h2></div><Mail className="text-coral" size={22} /></div>
        <p className="mt-4 text-sm leading-relaxed text-[#657067]">We sent a six-digit code to <strong className="text-moss">{user.email}</strong>. Verify your email to list or purchase projects.</p>
        <label className="mt-7 block font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]" htmlFor="email-otp">Verification code</label>
        <input id="email-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="mt-2 w-full border border-[#c3ccc1] bg-white px-4 py-4 text-center font-mono text-2xl tracking-[.35em] text-moss outline-none placeholder:text-[#b8c0b8] focus:border-coral focus:ring-2 focus:ring-coral/15" />
        <button type="submit" disabled={verifying || sending} className="mt-5 flex w-full items-center justify-center gap-2 bg-moss px-4 py-4 font-display text-sm font-semibold text-paper transition hover:bg-[#285844] disabled:cursor-wait disabled:opacity-60">{verifying ? 'Verifying...' : 'Verify OTP'} <CheckCircle2 size={16} /></button>
        <div className="mt-5 flex items-center justify-between border-t border-[#d8d9d0] pt-5"><span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.06em] text-[#879087]"><Clock3 size={14} /> {secondsLeft ? `Resend in ${secondsLeft}s` : 'Ready to resend'}</span><button type="button" disabled={secondsLeft > 0 || sending} onClick={sendOtp} className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[.06em] text-coral transition hover:text-[#c75e3d] disabled:cursor-not-allowed disabled:text-[#b8c0b8]"><RefreshCw size={13} className={sending ? 'animate-spin' : ''} /> Resend OTP</button></div>
      </form>
    </div>
    <Toast toast={toast} onClose={() => setToast(null)} />
  </>;
}
