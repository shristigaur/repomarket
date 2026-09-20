import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AIAssistantModal from './components/AIAssistantModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function scoreTone(score) {
  if (score > 70) return 'bg-[#b9d9c4] text-[#21563e]';
  if (score >= 50) return 'bg-[#eedb9c] text-[#765d16]';
  return 'bg-[#f0b6a4] text-[#8b3d2b]';
}

function Tags({ items, emptyLabel }) {
  if (!items?.length) return <span className="text-sm text-[#879188]">{emptyLabel}</span>;
  return <div className="flex flex-wrap gap-2">{items.map((item) => <span className="bg-[#cedfd0] px-2.5 py-1.5 font-mono text-[10px] text-[#315542]" key={item}>{item}</span>)}</div>;
}

export default function ListingCreation() {
  const [repoUrl, setRepoUrl] = useState('');
  const [price, setPrice] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleAnalyze(event) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setAnalysis(null);

    try {
      const response = await fetch(`${API_BASE_URL}/repos/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to analyze this repository.');
      setAnalysis(data);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in first');
      return;
    }

    setPublishing(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/listings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          repoUrl,
          repoName: analysis.name,
          description: analysis.description,
          price: Number(price),
          aiReport: analysis.aiReport
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to publish this listing.');
      window.location.assign('/marketplace');
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setPublishing(false);
    }
  }

  const report = analysis?.aiReport;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navbar actionHref="/" actionLabel="Browse marketplace" />

      <header className="mx-auto max-w-[1320px] px-[5vw] pb-14 pt-[78px]">
        <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.1em] text-coral"><span className="h-px w-8 bg-coral" /> List your next asset</div>
        <h1 className="mb-6 mt-3 max-w-[850px] font-display text-[clamp(3.2rem,7vw,7rem)] font-semibold leading-[.9] tracking-[-.05em] text-moss">Make your code<br /><em className="not-italic text-coral">worth more.</em></h1>
        <p className="max-w-[470px] text-base leading-relaxed text-[#657067]">Paste a public GitHub repository and get a buyer-ready analysis before you list.</p>
      </header>

      <section className="border-y border-[#d8d9d0]">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 lg:grid-cols-[.75fr_1.25fr]">
          <div className="border-b border-[#d8d9d0] bg-[#f8f7f1] px-[5vw] py-10 lg:border-b-0 lg:border-r">
            <p className="mb-9 flex items-center font-mono text-[10px] uppercase tracking-[.1em] text-moss"><span className="mr-3 grid h-6 w-6 place-items-center bg-coral text-paper">01</span>Repository details</p>
            <form onSubmit={handleAnalyze} className="flex flex-col">
              <label htmlFor="repo-url" className="mb-2 font-display text-sm font-semibold text-moss">GitHub repository URL</label>
              <input id="repo-url" type="url" required value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} placeholder="https://github.com/owner/repository" className="border border-[#c3ccc1] bg-paper px-4 py-3 text-sm text-moss outline-none transition placeholder:text-[#a6ada5] focus:border-coral focus:ring-2 focus:ring-coral/15" />
              <p className="mb-8 mt-2 text-xs leading-relaxed text-[#7a837a]">Public repositories only. We inspect the README and package manifest.</p>
              <label htmlFor="listing-price" className="mb-2 font-display text-sm font-semibold text-moss">Listing price ($)</label>
              <div className="flex items-center border border-[#c3ccc1] bg-paper px-4 focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/15"><span className="font-display text-xl text-coral">$</span><input id="listing-price" type="number" min="0" step="1" required value={price} onChange={(event) => setPrice(event.target.value)} placeholder="500" className="w-full bg-transparent px-2 py-3 text-sm text-moss outline-none placeholder:text-[#a6ada5]" /></div>
              <p className="mb-6 mt-2 text-xs leading-relaxed text-[#7a837a]">Set the price buyers will see on the marketplace.</p>
              <button type="submit" disabled={loading} className="flex items-center justify-between bg-moss px-4 py-4 text-left font-display text-sm font-semibold text-paper transition hover:bg-[#285844] focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-paper border-r-transparent" /> Analyzing repository...</> : <>Analyze &amp; preview <span>-&gt;</span></>}</button>
            </form>
            {message && <p role="alert" className={`mt-5 p-3 text-xs leading-relaxed ${message.type === 'error' ? 'bg-[#f5ddd4] text-[#8b3d2b]' : 'bg-[#d9e9d9] text-[#21563e]'}`}>{message.text}</p>}
          </div>

          <div className="min-h-[580px] bg-[#e3e9e1] px-[5vw] py-10">
            {!analysis && !loading && <div className="flex min-h-[500px] flex-col justify-center"><p className="font-mono text-[10px] uppercase tracking-[.1em] text-coral">Your report will appear here</p><h2 className="mt-3 font-display text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[.92] tracking-[-.06em] text-moss">See the value<br />in your repository.</h2><p className="mt-5 max-w-[300px] text-sm leading-relaxed text-[#6c776d]">Technical detail, translated into a clear story for the next owner.</p></div>}
            {loading && <div className="flex min-h-[500px] flex-col justify-center"><span className="mb-5 h-8 w-8 animate-spin rounded-full border-2 border-coral border-r-transparent" /><h2 className="font-display text-4xl font-semibold leading-[.95] tracking-[-.06em] text-moss">Reading between<br />the lines...</h2><p className="mt-4 text-sm text-[#6c776d]">Fetching repository details and building your buyer report.</p></div>}
            {analysis && !loading && <ReportCard analysis={analysis} report={report} price={price} publishing={publishing} onPublish={handlePublish} />}
          </div>
        </div>
      </section>
      <AIAssistantModal />
    </main>
  );
}

function ReportCard({ analysis, report, price, publishing, onPublish }) {
  const score = Number(report?.codeHealthScore || 0);
  return <article className="animate-[reveal_.45s_ease_both]">
    <div className="flex items-start justify-between gap-5 border-b border-[#c4ccc1] pb-6"><div><p className="font-mono text-[10px] uppercase tracking-[.1em] text-coral">AI report preview</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-[-.06em] text-moss">{analysis.name}</h2><a className="font-mono text-[10px] text-[#798279]" href={analysis.html_url || analysis.repoUrl} target="_blank" rel="noreferrer">{analysis.html_url || 'View repository'} ↗</a></div><span className={`flex h-[78px] w-[78px] shrink-0 flex-col items-center justify-center rounded-full font-display ${scoreTone(score)}`}><strong className="text-2xl leading-none">{score}</strong><small className="mt-1 font-mono text-[9px] uppercase">quality</small></span></div>
    <div className="grid grid-cols-1 gap-5 border-b border-[#c4ccc1] py-6 sm:grid-cols-3"><div><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Score-based market rate</span><strong className="mt-2 block font-display text-2xl tracking-[-.04em] text-moss">${Number(analysis.marketRate || 0).toLocaleString()}</strong></div><div><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">AI valuation range</span><strong className="mt-2 block font-display text-xl tracking-[-.04em] text-moss">{report?.estimatedValuation || 'Not available'}</strong></div><div><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Your asking price</span><strong className="mt-2 block font-display text-2xl tracking-[-.04em] text-moss">${Number(price).toLocaleString()}</strong></div></div>
    <div className="border-b border-[#c4ccc1] py-6"><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Launch readiness</span><p className="mt-3 text-sm leading-relaxed text-[#435248]">{report?.launchReadiness || 'Not available'}</p></div>
    <div className="grid grid-cols-1 gap-6 border-b border-[#c4ccc1] py-6 sm:grid-cols-2"><div><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Frameworks &amp; runtime</span><div className="mt-3"><Tags items={report?.techStackDetails?.frameworks} emptyLabel="No frameworks returned" /><p className="mt-3 text-xs text-[#687269]">{report?.techStackDetails?.runtime || 'Runtime not specified'}</p></div></div><div><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Database / ORM</span><div className="mt-3"><Tags items={report?.techStackDetails?.database} emptyLabel="No database detected" /></div></div></div>
    <div className="grid grid-cols-1 gap-6 border-b border-[#c4ccc1] py-6 sm:grid-cols-2"><div><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Project completeness</span><p className="mt-3 text-sm text-[#435248]">{report?.projectCompleteness?.documentationRating || 'Unknown'} documentation · {report?.projectCompleteness?.hasTests ? 'Tests detected' : 'No tests detected'} · {report?.projectCompleteness?.hasDeploymentConfig ? 'Deployment config found' : 'No deployment config'}</p><div className="mt-3"><Tags items={report?.projectCompleteness?.completedFeatures} emptyLabel="No completed features returned" /></div></div><div><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Dependency audit</span><p className="mt-3 text-sm text-[#435248]">{report?.dependencyAudit?.totalDependencies ?? 0} total dependencies</p><Tags items={report?.dependencyAudit?.paidApiIntegrations} emptyLabel="No paid APIs detected" /></div></div>
    <div className="py-6"><span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Risk &amp; security</span><p className="mt-3 text-sm text-[#435248]">{report?.riskAndSecurity?.licenseType || 'License unknown'} · {report?.riskAndSecurity?.hasEnvExample ? '.env.example found' : 'No .env.example found'}</p>{report?.riskAndSecurity?.riskFlags?.length ? <ul className="mt-3 space-y-2 text-sm text-[#5e665f]">{report.riskAndSecurity.riskFlags.map((issue) => <li key={issue}><span className="mr-2 text-coral">•</span>{issue}</li>)}</ul> : <p className="mt-3 text-sm text-[#879188]">No risk flags returned.</p>}</div>
    <button type="button" onClick={onPublish} disabled={publishing} className="flex w-full items-center justify-between bg-coral px-4 py-4 font-display text-sm font-semibold text-paper transition hover:bg-[#c75e3d] disabled:cursor-wait disabled:opacity-60">{publishing ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-paper border-r-transparent" /> Publishing...</> : <>Confirm &amp; list for sale <span>-&gt;</span></>}</button>
  </article>;
}