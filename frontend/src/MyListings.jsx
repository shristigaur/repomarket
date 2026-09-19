import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, ExternalLink, ShieldAlert } from 'lucide-react';
import Navbar from './components/Navbar';
import RatingModal from './components/RatingModal';
import { API_BASE_URL, authHeaders, useAuth } from './auth';

function formatPrice(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

export default function MyListings() {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [ratingTarget, setRatingTarget] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return undefined;
    }
    Promise.all([
      fetch(`${API_BASE_URL}/listings/mine`, { headers: authHeaders() }),
      fetch(`${API_BASE_URL}/listings/purchases`, { headers: authHeaders() })
    ])
      .then(async ([listingResponse, purchaseResponse]) => {
        const [listingData, purchaseData] = await Promise.all([listingResponse.json(), purchaseResponse.json()]);
        if (!listingResponse.ok) throw new Error(listingData.error || 'Unable to load your listings.');
        if (!purchaseResponse.ok) throw new Error(purchaseData.error || 'Unable to load your purchases.');
        setListings(listingData);
        setPurchases(purchaseData);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
    return undefined;
  }, [user]);

  async function withdrawListing() {
    try {
      const response = await fetch(`${API_BASE_URL}/listings/${withdrawTarget._id}/withdraw`, { method: 'PATCH', headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to withdraw listing.');
      setListings((current) => current.map((listing) => listing._id === data._id ? data : listing));
      setWithdrawTarget(null);
    } catch (requestError) {
      setError(requestError.message);
      setWithdrawTarget(null);
    }
  }

  if (authLoading) return <main className="grid min-h-screen place-items-center bg-paper font-mono text-xs uppercase tracking-[.1em] text-moss">Loading account...</main>;

  return <main className="min-h-screen bg-paper text-ink"><Navbar actionHref="/" actionLabel="Browse marketplace" /><header className="mx-auto max-w-[1320px] px-[5vw] pb-12 pt-16"><p className="font-mono text-[10px] uppercase tracking-[.1em] text-coral">Seller workspace</p><h1 className="mt-3 font-display text-6xl font-semibold tracking-[-.06em] text-moss">My listings.</h1><p className="mt-4 max-w-[440px] text-sm leading-relaxed text-[#657067]">Manage active assets and review completed transactions from one place.</p></header>
    <section className="border-y border-[#d8d9d0]"><div className="mx-auto max-w-[1320px] px-[5vw] py-10">
      {!user && <div className="border border-[#efc0b1] bg-[#f5ddd4] p-5 text-sm text-[#8b3d2b]">Sign in to manage your listings.</div>}
      {user && loading && <p className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Loading your listings...</p>}
      {user && !loading && error && <div className="border border-[#efc0b1] bg-[#f5ddd4] p-5 text-sm text-[#8b3d2b]">{error}</div>}
      {user && !loading && !error && !listings.length && <div className="border-y border-[#d8d9d0] py-20 text-center"><p className="font-mono text-[10px] uppercase tracking-[.1em] text-coral">No listings yet</p><a className="mt-4 inline-block bg-moss px-4 py-3 font-display text-sm font-semibold text-paper" href="/create">List your first repository -&gt;</a></div>}
      {user && !loading && !error && listings.length > 0 && <div className="grid gap-4">{listings.map((listing) => <article className="flex flex-col gap-5 border border-[#cbd1c8] bg-[#f8f7f1] p-5 sm:flex-row sm:items-center sm:justify-between" key={listing._id}><div className="min-w-0"><div className="mb-2 flex items-center gap-2"><span className={`font-mono text-[9px] uppercase tracking-[.1em] ${listing.status === 'ACTIVE' ? 'text-[#21563e]' : listing.status === 'SOLD' ? 'text-coral' : 'text-[#879087]'}`}>{listing.status}</span><span className="text-[#c4ccc1]">/</span><span className="font-mono text-[9px] text-[#879087]">{formatPrice(listing.price)}</span></div><h2 className="truncate font-display text-2xl font-semibold tracking-[-.04em] text-moss">{listing.repoName || 'Untitled repository'}</h2><a className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-[#7b837b] hover:text-coral" href={listing.repoUrl} target="_blank" rel="noreferrer">View repository <ExternalLink size={11} /></a></div><div className="flex shrink-0 flex-wrap gap-2">{listing.status === 'ACTIVE' && <button className="inline-flex items-center gap-2 border border-[#efc0b1] px-3 py-2 font-mono text-[10px] uppercase tracking-[.06em] text-[#8b3d2b] transition hover:bg-[#f5ddd4]" onClick={() => setWithdrawTarget(listing)}><ShieldAlert size={14} /> Withdraw listing</button>}{listing.status === 'SOLD' && listing.buyerId && <button className="inline-flex items-center gap-2 bg-coral px-3 py-2 font-mono text-[10px] uppercase tracking-[.06em] text-paper transition hover:bg-[#c75e3d]" onClick={() => setRatingTarget({ listing, revieweeId: listing.buyerId, revieweeName: 'your buyer' })}><Check size={14} /> Rate buyer</button>}</div></article>)}</div>}
      {user && !loading && !error && <div className="mt-14"><div className="mb-5 flex items-end justify-between border-b border-[#d8d9d0] pb-4"><div><p className="font-mono text-[10px] uppercase tracking-[.1em] text-coral">Buyer workspace</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-[-.04em] text-moss">Completed purchases.</h2></div><span className="font-mono text-[10px] uppercase tracking-[.08em] text-[#879087]">{purchases.length} transactions</span></div>{purchases.length ? <div className="grid gap-4">{purchases.map((listing) => <article className="flex items-center justify-between gap-4 border border-[#cbd1c8] bg-[#f8f7f1] p-5" key={listing._id}><div><span className="font-mono text-[9px] uppercase tracking-[.1em] text-coral">Purchased asset</span><h3 className="mt-2 font-display text-xl font-semibold text-moss">{listing.repoName || 'Untitled repository'}</h3></div><button className="inline-flex shrink-0 items-center gap-2 bg-coral px-3 py-2 font-mono text-[10px] uppercase tracking-[.06em] text-paper transition hover:bg-[#c75e3d]" onClick={() => setRatingTarget({ listing, revieweeId: listing.sellerId, revieweeName: 'your seller' })}><Check size={14} /> Rate seller</button></article>)}</div> : <p className="text-sm text-[#879087]">Completed purchases will appear here.</p>}</div>}
    </div></section>
    {withdrawTarget && <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#18231f]/70 p-5" role="dialog" aria-modal="true"><div className="w-full max-w-[440px] bg-paper p-7 shadow-2xl"><AlertTriangle className="text-coral" size={26} /><h2 className="mt-4 font-display text-2xl font-semibold text-moss">Withdraw this listing?</h2><p className="mt-2 text-sm leading-relaxed text-[#657067]">{withdrawTarget.repoName} will disappear from the active marketplace. You can keep the record in your seller history.</p><div className="mt-6 flex justify-end gap-3"><button className="border border-[#cbd1c8] px-4 py-3 font-mono text-[10px] uppercase tracking-[.06em] text-moss" onClick={() => setWithdrawTarget(null)}>Keep listing</button><button className="bg-coral px-4 py-3 font-mono text-[10px] uppercase tracking-[.06em] text-paper" onClick={withdrawListing}>Withdraw</button></div></div></div>}
    {ratingTarget && <RatingModal listing={ratingTarget.listing} revieweeId={ratingTarget.revieweeId} revieweeName={ratingTarget.revieweeName} onClose={() => setRatingTarget(null)} />}
  </main>;
}
