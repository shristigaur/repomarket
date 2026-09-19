import React, { useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import AIAssistantModal from './components/AIAssistantModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function scoreTone(score) {
  if (score > 70) return 'bg-[#b9d9c4] text-[#21563e]';
  if (score >= 50) return 'bg-[#eedb9c] text-[#765d16]';
  return 'bg-[#f0b6a4] text-[#8b3d2b]';
}

function formatPrice(price) {
  return `$${Number(price || 0).toLocaleString()}`;
}

function App() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');
  const [stackFilter, setStackFilter] = useState('ALL');
  const [selectedListing, setSelectedListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadListings() {
      try {
        const response = await fetch(`${API_BASE_URL}/listings`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load marketplace listings.');
        if (active) setListings(Array.isArray(data) ? data : []);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadListings();
    return () => { active = false; };
  }, []);

  const stacks = useMemo(() => {
    const values = listings.flatMap((listing) => [
      ...(listing.aiReport?.techStackDetails?.frameworks || []),
      ...(listing.aiReport?.techStackDetails?.database || [])
    ]);
    return ['ALL', ...new Set(values)].sort((left, right) => left === 'ALL' ? -1 : right === 'ALL' ? 1 : left.localeCompare(right));
  }, [listings]);

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return listings.filter((listing) => {
      const stack = [
        ...(listing.aiReport?.techStackDetails?.frameworks || []),
        ...(listing.aiReport?.techStackDetails?.database || [])
      ];
      const searchable = [listing.repoName, listing.description, listing.repoUrl, ...stack].filter(Boolean).join(' ').toLowerCase();
      return (!query || searchable.includes(query)) && (stackFilter === 'ALL' || stack.includes(stackFilter));
    });
  }, [listings, search, stackFilter]);

  return (
    <main className="min-h-screen overflow-hidden bg-paper text-ink">
      <Navbar />

      <header className="mx-auto max-w-[1320px] px-[5vw] pb-16 pt-[82px]">
        <div className="flex items-end justify-between gap-8">
          <div>
            <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.1em] text-coral"><span className="h-px w-8 bg-coral" /> Explore the collection</div>
            <h1 className="mb-6 mt-3 max-w-[850px] font-display text-[clamp(3.3rem,7vw,7rem)] font-semibold leading-[.9] tracking-[-.05em] text-moss">Find your next<br /><em className="not-italic text-coral">head start.</em></h1>
            <p className="max-w-[470px] text-base leading-relaxed text-[#657067]">Browse analyzed repositories from builders who are ready to pass the baton.</p>
          </div>
          <div className="hidden h-[106px] w-[106px] rotate-7 flex-col justify-between bg-coral p-[13px] font-mono text-[10px] text-[#e8dfcb] sm:flex" aria-hidden="true">
            <span>02</span><span className="self-end [writing-mode:vertical-rl]">MARKET</span>
          </div>
        </div>
      </header>

      <section className="border-y border-[#cbd3c9] bg-[#e6ebe4]">
        <div className="mx-auto max-w-[1320px] px-[5vw] py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]" htmlFor="search">Search listings</label>
              <input id="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by repository or tech stack: React, Node, Python" className="w-full max-w-[620px] border border-[#c3ccc1] bg-paper px-4 py-3 text-sm text-moss outline-none transition placeholder:text-[#9ca69d] focus:border-coral focus:ring-2 focus:ring-coral/15" />
            </div>
            <div className="min-w-[210px]">
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]" htmlFor="stack">Filter by tech stack</label>
              <select id="stack" value={stackFilter} onChange={(event) => setStackFilter(event.target.value)} className="w-full border border-[#c3ccc1] bg-paper px-4 py-3 text-sm text-moss outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/15">
                {stacks.map((stack) => <option key={stack} value={stack}>{stack === 'ALL' ? 'All technologies' : stack}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-7 flex items-center justify-between border-t border-[#c4ccc1] pt-4 font-mono text-[10px] uppercase tracking-[.08em] text-[#7b837b]">
            <span>{filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'} available</span>
            {(search || stackFilter !== 'ALL') && <button className="text-coral underline underline-offset-4" onClick={() => { setSearch(''); setStackFilter('ALL'); }}>Clear filters</button>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-[5vw] py-14">
        {loading && <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-coral border-r-transparent" /><p className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Loading the collection...</p></div>}
        {!loading && error && <div className="border border-[#efc0b1] bg-[#f5ddd4] p-5 text-sm text-[#8b3d2b]">{error}</div>}
        {!loading && !error && !filteredListings.length && <div className="border-y border-[#d8d9d0] py-24 text-center"><div className="mx-auto mb-5 grid h-12 w-12 place-items-center border border-[#cbd3c9] font-mono text-sm text-coral">/ /</div><p className="font-mono text-[10px] uppercase tracking-[.1em] text-coral">No match found</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-.04em] text-moss">Try a different signal.</h2><p className="mx-auto mt-3 max-w-[320px] text-sm leading-relaxed text-[#7a837a]">Adjust your filters or be the first builder to list a repository.</p></div>}
        {!loading && !error && filteredListings.length > 0 && <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredListings.map((listing) => <ListingCard key={listing._id || listing.repoUrl} listing={listing} onView={() => setSelectedListing(listing)} />)}</div>}
      </section>

      <footer className="mx-auto flex max-w-[1320px] justify-between border-t border-[#d8d9d0] px-[5vw] py-7 font-mono text-[10px] uppercase tracking-[.04em] text-[#879087]"><span>RepoMarket / 2026</span><span>Built for the builders</span></footer>

      {selectedListing && <ListingModal listing={selectedListing} onClose={() => setSelectedListing(null)} />}
      <AIAssistantModal />
    </main>
  );
}

function ListingCard({ listing, onView }) {
  const report = listing.aiReport || {};
  const score = Number(report.codeHealthScore || 0);

  return (
    <article className="group flex min-h-[370px] flex-col border border-[#cbd1c8] border-t-4 border-t-coral bg-[#f8f7f1] p-6 transition duration-200 hover:-translate-y-1 hover:border-moss hover:border-t-coral hover:shadow-[8px_8px_0_#cbd1d0]">
      <div className="flex items-start justify-between gap-4 border-b border-[#d8d9d0] pb-5">
        <div className="min-w-0"><p className="mb-2 font-mono text-[10px] uppercase tracking-[.1em] text-coral">Available asset</p><h2 className="truncate font-display text-2xl font-semibold tracking-[-.05em] text-moss" title={listing.repoName}>{listing.repoName || 'Untitled repository'}</h2></div>
        <span className={`shrink-0 rounded-full px-3 py-2 font-display text-sm font-bold ${scoreTone(score)}`}>{score}<span className="ml-1 text-[9px] font-normal uppercase">/100</span></span>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="grid grid-cols-2 gap-4 border-b border-[#d8d9d0] py-5"><div><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Asking price</span><strong className="mt-1 block font-display text-2xl tracking-[-.05em] text-moss">{formatPrice(listing.price)}</strong></div><div><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Market rate</span><strong className="mt-1 block font-display text-2xl tracking-[-.05em] text-coral">{formatPrice(listing.marketRate)}</strong></div></div>
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Launch readiness</div>
        <p className="line-clamp-3 min-h-[65px] text-sm leading-relaxed text-[#657067]">{report.launchReadiness || listing.description || 'A promising repository ready for its next chapter.'}</p>
        <div className="mt-5"><div className="mb-2 font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Frameworks</div><div className="flex flex-wrap gap-1.5">{(report.techStackDetails?.frameworks || []).slice(0, 4).map((stack) => <span className="bg-[#cedfd0] px-2 py-1 font-mono text-[10px] text-[#315542]" key={stack}>{stack}</span>)}{!(report.techStackDetails?.frameworks || []).length && <span className="text-xs text-[#879188]">Stack not specified</span>}</div></div>
      </div>
      <button onClick={onView} className="mt-6 flex w-full items-center justify-between bg-moss px-4 py-3.5 text-left font-display text-sm font-semibold text-paper transition hover:bg-[#285844] focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2">View code report &amp; buy <span aria-hidden="true">-&gt;</span></button>
    </article>
  );
}

function ListingModal({ listing, onClose }) {
  const report = listing.aiReport || {};
  return <div className="fixed inset-0 z-10 flex items-center justify-center bg-[#18231f]/70 p-5" role="dialog" aria-modal="true" aria-label={`${listing.repoName} details`} onClick={onClose}>
    <div className="max-h-[90vh] w-full max-w-[620px] overflow-y-auto bg-paper p-7 shadow-2xl sm:p-10" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-5 border-b border-[#d8d9d0] pb-6"><div><p className="font-mono text-[10px] uppercase tracking-[.1em] text-coral">Repository details</p><h2 className="mt-2 font-display text-4xl font-semibold tracking-[-.06em] text-moss">{listing.repoName}</h2></div><button onClick={onClose} className="font-mono text-xl text-[#7b837b] hover:text-coral" aria-label="Close details">x</button></div>
      <div className="grid grid-cols-3 gap-5 border-b border-[#d8d9d0] py-6"><div><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Price</span><strong className="mt-2 block font-display text-2xl text-moss">{formatPrice(listing.price)}</strong></div><div><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Market rate</span><strong className="mt-2 block font-display text-2xl text-coral">{formatPrice(listing.marketRate)}</strong></div><div><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Quality score</span><strong className="mt-2 block font-display text-2xl text-moss">{report.codeHealthScore || 'N/A'} / 100</strong></div></div>
      <div className="py-6"><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Launch readiness</span><p className="mt-3 text-sm leading-relaxed text-[#435248]">{report.launchReadiness || listing.description || 'No launch estimate provided.'}</p></div>
      <div className="border-t border-[#d8d9d0] py-6"><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Tech stack</span><div className="mt-3 flex flex-wrap gap-2">{(report.techStackDetails?.frameworks || []).concat(report.techStackDetails?.database || []).map((stack) => <span className="bg-[#cedfd0] px-2.5 py-1.5 font-mono text-[10px] text-[#315542]" key={stack}>{stack}</span>)}</div></div>
      <a className="flex w-full items-center justify-between bg-coral px-4 py-4 font-display text-sm font-semibold text-paper hover:bg-[#c75e3d]" href={listing.repoUrl} target="_blank" rel="noreferrer">Inspect repository on GitHub <span aria-hidden="true">↗</span></a>
    </div>
  </div>;
}

export default App;