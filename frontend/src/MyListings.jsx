import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, ExternalLink, ShieldAlert } from 'lucide-react';
import Navbar from './components/Navbar';
import RatingModal from './components/RatingModal';
import MyListingsView from './components/MyListingsView';
import { useAuth } from './auth';
import { apiFetch } from './api';

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
      apiFetch('/listings/mine'),
      apiFetch('/listings/purchases')
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
      const response = await apiFetch(`/listings/${withdrawTarget._id}/withdraw`, { method: 'PATCH' });
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

  return <main className="min-h-screen bg-paper text-ink"><Navbar actionHref="/" actionLabel="Browse marketplace" /><header className="mx-auto max-w-[1320px] px-[5vw] pb-12 pt-16 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6"><div><p className="font-mono text-[10px] uppercase tracking-[.1em] text-coral">Seller workspace</p><h1 className="mt-3 font-display text-6xl font-semibold tracking-[-.06em] text-moss">My listings.</h1><p className="mt-4 max-w-[440px] text-sm leading-relaxed text-[#657067]">Manage active assets and review completed transactions from one place.</p></div><a href="/listings/create" className="inline-flex items-center justify-center bg-moss px-6 py-3 font-mono text-[12px] font-bold uppercase tracking-wider text-paper transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#dc6f48]">+ Create Listing</a></header>
    <section className="border-y border-[#d8d9d0]"><div className="mx-auto max-w-[1320px] px-[5vw] py-10">
      {!user && <div className="border border-[#efc0b1] bg-[#f5ddd4] p-5 text-sm text-[#8b3d2b]">Sign in to manage your listings.</div>}
      {user && loading && <p className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Loading your listings...</p>}
      {user && !loading && error && <div className="border border-[#efc0b1] bg-[#f5ddd4] p-5 text-sm text-[#8b3d2b]">{error}</div>}
      {user && !loading && !error && <MyListingsView />}
      {user && !loading && !error && <div className="mt-14"><div className="mb-5 flex items-end justify-between border-b border-[#d8d9d0] pb-4"><div><p className="font-mono text-[10px] uppercase tracking-[.1em] text-coral">Buyer workspace</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-[-.04em] text-moss">Completed purchases.</h2></div><span className="font-mono text-[10px] uppercase tracking-[.08em] text-[#879087]">{purchases.length} transactions</span></div>{purchases.length ? <div className="grid gap-4">{purchases.map((listing) => <article className="flex items-center justify-between gap-4 border border-[#cbd1c8] bg-[#f8f7f1] p-5" key={listing._id}><div><span className="font-mono text-[9px] uppercase tracking-[.1em] text-coral">Purchased asset</span><h3 className="mt-2 font-display text-xl font-semibold text-moss">{listing.repoName || 'Untitled repository'}</h3></div><button className="inline-flex shrink-0 items-center gap-2 bg-coral px-3 py-2 font-mono text-[10px] uppercase tracking-[.06em] text-paper transition hover:bg-[#c75e3d]" onClick={() => setRatingTarget({ listing, revieweeId: listing.sellerId, revieweeName: 'your seller' })}><Check size={14} /> Rate seller</button></article>)}</div> : <p className="text-sm text-[#879087]">Completed purchases will appear here.</p>}</div>}
    </div></section>
    {withdrawTarget && <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#18231f]/70 p-5" role="dialog" aria-modal="true"><div className="w-full max-w-[440px] bg-paper p-7 shadow-2xl"><AlertTriangle className="text-coral" size={26} /><h2 className="mt-4 font-display text-2xl font-semibold text-moss">Withdraw this listing?</h2><p className="mt-2 text-sm leading-relaxed text-[#657067]">{withdrawTarget.repoName} will disappear from the active marketplace. You can keep the record in your seller history.</p><div className="mt-6 flex justify-end gap-3"><button className="border border-[#cbd1c8] px-4 py-3 font-mono text-[10px] uppercase tracking-[.06em] text-moss" onClick={() => setWithdrawTarget(null)}>Keep listing</button><button className="bg-coral px-4 py-3 font-mono text-[10px] uppercase tracking-[.06em] text-paper" onClick={withdrawListing}>Withdraw</button></div></div></div>}
    {ratingTarget && <RatingModal listing={ratingTarget.listing} revieweeId={ratingTarget.revieweeId} revieweeName={ratingTarget.revieweeName} onClose={() => setRatingTarget(null)} />}
  </main>;
}
