import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { authHeaders } from '../auth';
import { apiFetch } from '../api';

export default function RatingModal({ listing, revieweeId, revieweeName, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submitRating(event) {
    event.preventDefault();
    if (!rating) return setError('Choose a star rating first.');
    setSaving(true);
    setError('');
    try {
      const response = await apiFetch('/ratings', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing._id, revieweeId, rating, comment })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to submit rating.');
      onSubmitted?.(data);
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#18231f]/70 p-5" role="dialog" aria-modal="true" aria-label="Rate transaction" onClick={onClose}>
    <form className="w-full max-w-[480px] bg-paper p-7 shadow-2xl sm:p-9" onSubmit={submitRating} onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between border-b border-[#d8d9d0] pb-5"><div><p className="font-mono text-[10px] uppercase tracking-[.1em] text-coral">Transaction review</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-[-.05em] text-moss">Rate {revieweeName || 'your partner'}</h2></div><button type="button" onClick={onClose} className="text-[#7b837b] hover:text-coral" aria-label="Close rating modal"><X size={20} /></button></div>
      <div className="py-7"><p className="mb-4 text-sm text-[#657067]">How was your experience with this transaction?</p><div className="flex gap-2" onMouseLeave={() => setHovered(0)}>{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className="rounded p-1 text-coral transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-coral" onMouseEnter={() => setHovered(value)} onClick={() => setRating(value)} aria-label={`${value} star${value > 1 ? 's' : ''}`}><Star size={31} fill={(hovered || rating) >= value ? 'currentColor' : 'none'} /></button>)}</div><p className="mt-3 font-mono text-[10px] uppercase tracking-[.08em] text-[#879087]">{rating ? `${rating} of 5 stars` : 'Select a rating'}</p></div>
      <label className="block font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]" htmlFor="rating-comment">Feedback <span className="normal-case tracking-normal">(optional)</span></label><textarea id="rating-comment" value={comment} onChange={(event) => setComment(event.target.value)} rows="4" maxLength="2000" placeholder="Share a useful note about the transaction" className="mt-2 w-full resize-none border border-[#c3ccc1] bg-white px-3 py-3 text-sm text-moss outline-none focus:border-coral focus:ring-2 focus:ring-coral/15" />
      {error && <p className="mt-4 bg-[#f5ddd4] p-3 text-xs text-[#8b3d2b]" role="alert">{error}</p>}
      <button disabled={saving} className="mt-6 flex w-full items-center justify-between bg-coral px-4 py-4 font-display text-sm font-semibold text-paper transition hover:bg-[#c75e3d] disabled:opacity-60">{saving ? 'Submitting...' : 'Submit review'} <span aria-hidden="true">-&gt;</span></button>
    </form>
  </div>;
}
