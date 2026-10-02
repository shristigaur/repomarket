import React, { useEffect, useState } from 'react';
import { ExternalLink, Trash2, AlertTriangle, Star, CheckCircle2, DollarSign } from 'lucide-react';
import { apiFetch } from '../api';
import { useAuth } from '../auth';

export default function MyListingsView() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      fetchListings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchListings = async () => {
    if (!user || !user._id) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/listings/my-listings?userId=${encodeURIComponent(user._id)}`);
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'Unable to load your listings.');
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !user) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/listings/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to remove listing.');
      
      // Update local state
      setListings((prev) => prev.filter(listing => listing._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center font-mono text-sm uppercase tracking-wider text-moss/60">
        Loading your listings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-coral/30 bg-coral/5 p-6 text-center text-coral">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8 opacity-80" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-moss/30 bg-sage/10 py-16 text-center">
          <div className="mb-4 rounded-full bg-sage p-4 text-moss">
            <ExternalLink className="h-8 w-8" />
          </div>
          <h3 className="mb-2 font-display text-2xl font-bold text-moss">No listings yet</h3>
          <p className="mb-6 max-w-sm text-sm text-ink/70">
            You haven't listed any repositories for sale yet. Turn your code into cash by listing a project!
          </p>
          <a
            href="/listings/create"
            className="bg-coral px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#2b3d2b]"
          >
            List a Repository
          </a>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <div
              key={listing._id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-[#d8d9d0] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between border-b border-[#d8d9d0] bg-sage/20 p-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                        listing.status === 'active'
                          ? 'bg-moss/10 text-moss'
                          : listing.status === 'sold'
                          ? 'bg-coral/10 text-coral'
                          : 'bg-ink/10 text-ink/70'
                      }`}
                    >
                      {listing.status === 'active' && <div className="mr-1 h-1.5 w-1.5 rounded-full bg-moss" />}
                      {listing.status}
                    </span>
                    {listing.aiRating && (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-sage px-1.5 py-0.5 font-mono text-[10px] text-moss">
                        <Star className="h-3 w-3 fill-current" /> {listing.aiRating}/10
                      </span>
                    )}
                  </div>
                  <h3 className="truncate font-display text-lg font-bold text-moss" title={listing.repoName}>
                    {listing.repoName || 'Untitled Repo'}
                  </h3>
                  <a
                    href={listing.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[10px] text-moss/60 hover:text-coral"
                  >
                    View on GitHub <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-0.5 font-mono text-[10px] uppercase tracking-wider text-moss/60">Asking Price</p>
                    <p className="font-display text-xl font-bold text-ink">
                      ${listing.userPrice?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="mb-0.5 font-mono text-[10px] uppercase tracking-wider text-moss/60">AI Value</p>
                    <p className="font-display text-lg font-semibold text-moss/80">
                      ${listing.aiEstimatedPrice?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  {listing.status === 'active' && (
                    <button
                      onClick={() => setDeleteTarget(listing)}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-coral/30 px-4 py-2 font-mono text-xs uppercase tracking-wider text-coral transition-colors hover:bg-coral/5"
                    >
                      <Trash2 className="h-4 w-4" /> Remove / Abandon
                    </button>
                  )}
                  {listing.status === 'sold' && (
                    <div className="flex w-full items-center justify-center gap-2 rounded-md bg-sage/40 px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider text-moss">
                      <CheckCircle2 className="h-4 w-4" /> Sold
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteTarget(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-[#d8d9d0] bg-paper p-6 shadow-2xl">
            <div className="mb-4 inline-flex rounded-full bg-coral/10 p-3 text-coral">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="mb-2 font-display text-xl font-bold text-moss">Remove Listing?</h2>
            <p className="mb-6 text-sm text-ink/80">
              Are you sure you want to abandon and remove <strong>{deleteTarget.repoName}</strong> from the marketplace? This action will set the status to REMOVED.
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-md border border-[#d8d9d0] px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-black/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex justify-center rounded-md bg-coral px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#2b3d2b] disabled:pointer-events-none disabled:opacity-50"
              >
                {isDeleting ? 'Removing...' : 'Remove Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
