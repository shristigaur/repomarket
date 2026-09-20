import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const initialReport = {
  summary: '',
  codeQualityScore: 0,
  estimatedValuation: '',
  keyFeatures: [],
  techStack: [],
  potentialIssues: []
};

function scoreTone(score) {
  if (score > 70) return 'good';
  if (score >= 50) return 'steady';
  return 'risk';
}

function TagList({ items, emptyLabel }) {
  if (!items?.length) return <span className="muted">{emptyLabel}</span>;

  return (
    <div className="tag-list">
      {items.map((item) => <span className="tag" key={item}>{item}</span>)}
    </div>
  );
}

function App() {
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
        body: JSON.stringify({ url: repoUrl })
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
    setPublishing(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setMessage({ type: 'success', text: 'Listing published. Your repository is now ready for buyers.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setPublishing(false);
    }
  }

  const report = analysis?.aiReport || initialReport;
  const tone = scoreTone(report.codeQualityScore);

  return (
    <main className="app-shell">
      <nav className="topbar">
        <a className="brand" href="/" aria-label="RepoMarket home">
          <span className="brand-mark">R</span>
          <span>RepoMarket</span>
        </a>
        <span className="topbar-note">The marketplace for useful code</span>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">List your next asset</p>
          <h1>Make your code<br /><em>worth more.</em></h1>
          <p className="hero-lede">Paste a public GitHub repository. We will read the signal in your code and shape it into a buyer-ready listing.</p>
        </div>
        <div className="hero-stamp" aria-hidden="true">
          <span>01</span>
          <span>ANALYZE</span>
        </div>
      </section>

      <section className="workspace">
        <div className="form-column">
          <div className="section-kicker"><span>01</span> Repository details</div>
          <form className="listing-form" onSubmit={handleAnalyze}>
            <label htmlFor="repo-url">GitHub repository URL</label>
            <input
              id="repo-url"
              type="url"
              required
              placeholder="https://github.com/owner/repository"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
            />
            <p className="field-help">Public repositories only. We will fetch the README and package manifest.</p>

            <label htmlFor="listing-price">Your asking price</label>
            <div className="price-input">
              <span>$</span>
              <input
                id="listing-price"
                type="number"
                min="0"
                step="1"
                required
                placeholder="500"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </div>
            <p className="field-help">Set the price buyers will see on the marketplace.</p>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Reading repository...</> : <>Analyze repository <span aria-hidden="true">-&gt;</span></>}
            </button>
          </form>

          {message && <div className={`notice ${message.type}`} role="status">{message.text}</div>}

          <div className="trust-note">
            <span className="shield">+</span>
            <span><strong>Private by default.</strong> We only inspect public repository files and never publish without your confirmation.</span>
          </div>
        </div>

        <div className="report-column">
          {!analysis && !loading && (
            <div className="empty-report">
              <div className="empty-icon">/ /</div>
              <p className="eyebrow">Your report will appear here</p>
              <h2>See the value<br />in your repository.</h2>
              <p>Our analysis turns technical detail into a clear story for the next owner.</p>
            </div>
          )}

          {loading && (
            <div className="loading-report">
              <span className="large-spinner" />
              <h2>Reading between<br />the lines...</h2>
              <p>Fetching repository details and building your buyer report.</p>
            </div>
          )}

          {analysis && !loading && (
            <article className="report-card">
              <div className="report-heading">
                <div>
                  <p className="eyebrow">AI valuation report</p>
                  <h2>{analysis.name}</h2>
                  <a href={repoUrl} target="_blank" rel="noreferrer">{repoUrl.replace('https://github.com/', '')} <span aria-hidden="true">↗</span></a>
                </div>
                <div className={`score-badge ${tone}`}>
                  <strong>{report.codeQualityScore}</strong>
                  <span>quality</span>
                </div>
              </div>

              <div className="valuation-row">
                <div>
                  <span className="label">Estimated valuation</span>
                  <strong>{report.estimatedValuation || 'Not available'}</strong>
                </div>
                <div className="valuation-rule" />
                <div>
                  <span className="label">Your asking price</span>
                  <strong>${Number(price || 0).toLocaleString()}</strong>
                </div>
              </div>

              <div className="report-section summary-section">
                <span className="label">Plain-English summary</span>
                <p>{report.summary || 'No summary was returned.'}</p>
              </div>

              <div className="report-grid">
                <div className="report-section">
                  <span className="label">Key features</span>
                  <TagList items={report.keyFeatures} emptyLabel="No features returned" />
                </div>
                <div className="report-section">
                  <span className="label">Tech stack</span>
                  <TagList items={report.techStack} emptyLabel="No stack returned" />
                </div>
              </div>

              <div className="report-section issues-section">
                <span className="label">Potential issues</span>
                {report.potentialIssues?.length ? (
                  <ul>{report.potentialIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
                ) : <p className="muted">No potential issues returned.</p>}
              </div>

              <button className="publish-button" type="button" onClick={handlePublish} disabled={publishing || !price}>
                {publishing ? <><span className="spinner dark" /> Publishing...</> : <>Confirm &amp; publish listing <span aria-hidden="true">-&gt;</span></>}
              </button>
            </article>
          )}
        </div>
      </section>

      <footer><span>RepoMarket / 2026</span><span>Built for the builders</span></footer>
    </main>
  );
}

export default App;
