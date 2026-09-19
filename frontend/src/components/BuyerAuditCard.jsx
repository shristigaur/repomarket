import React from 'react';

const EMPTY_REPORT = {
  codeHealthScore: 0,
  estimatedValuation: 'Not available',
  launchReadiness: 'Not available',
  techStackDetails: { frameworks: [], database: [], runtime: 'Not specified' },
  projectCompleteness: { completedFeatures: [], hasTests: false, hasDeploymentConfig: false, documentationRating: 'Low' },
  dependencyAudit: { totalDependencies: 0, deprecatedOrOutdated: [], paidApiIntegrations: [] },
  riskAndSecurity: { licenseType: 'Unlicensed', hasEnvExample: false, riskFlags: [] }
};

function scoreStyles(score) {
  if (score > 70) return { badge: 'bg-[#b9d9c4] text-[#21563e]', label: 'Healthy' };
  if (score >= 50) return { badge: 'bg-[#eedb9c] text-[#765d16]', label: 'Needs attention' };
  return { badge: 'bg-[#f0b6a4] text-[#8b3d2b]', label: 'At risk' };
}

function BadgeList({ items, emptyLabel = 'None detected', tone = 'default' }) {
  const badgeTone = tone === 'danger'
    ? 'border-[#efc0b1] bg-[#f5ddd4] text-[#8b3d2b]'
    : 'border-[#b9d2bd] bg-[#cedfd0] text-[#315542]';

  if (!items?.length) return <span className="text-sm text-[#879188]">{emptyLabel}</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => <span className={`border px-2.5 py-1.5 font-mono text-[10px] ${badgeTone}`} key={item}>{item}</span>)}
    </div>
  );
}

function SectionLabel({ children }) {
  return <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">{children}</h3>;
}

export default function BuyerAuditCard({ report, className = '' }) {
  const audit = {
    ...EMPTY_REPORT,
    ...report,
    techStackDetails: { ...EMPTY_REPORT.techStackDetails, ...report?.techStackDetails },
    projectCompleteness: { ...EMPTY_REPORT.projectCompleteness, ...report?.projectCompleteness },
    dependencyAudit: { ...EMPTY_REPORT.dependencyAudit, ...report?.dependencyAudit },
    riskAndSecurity: { ...EMPTY_REPORT.riskAndSecurity, ...report?.riskAndSecurity }
  };
  const score = Number(audit.codeHealthScore) || 0;
  const scoreTone = scoreStyles(score);
  const technologies = [
    ...audit.techStackDetails.frameworks,
    ...audit.techStackDetails.database
  ];

  return (
    <article className={`border border-[#cbd1c8] border-t-4 border-t-coral bg-[#f8f7f1] p-6 text-ink shadow-[8px_8px_0_#d8ded7] sm:p-8 ${className}`}>
      <header className="flex flex-col gap-6 border-b border-[#d8d9d0] pb-7 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[.1em] text-coral">Buyer trust &amp; code audit</p>
          <h2 className="font-display text-3xl font-semibold tracking-[-.05em] text-moss">Repository assessment</h2>
          <p className="mt-2 max-w-[430px] text-sm leading-relaxed text-[#657067]">A practical snapshot of quality, readiness, dependencies, and buyer risk.</p>
        </div>
        <div className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full ${scoreTone.badge}`}>
          <strong className="font-display text-3xl leading-none">{score}</strong>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[.08em]">health / 100</span>
        </div>
      </header>

      <div className="grid gap-4 border-b border-[#d8d9d0] py-6 sm:grid-cols-2">
        <div className="border border-[#d8d9d0] bg-paper p-4">
          <span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Estimated valuation</span>
          <strong className="mt-2 block font-display text-2xl tracking-[-.04em] text-moss">{audit.estimatedValuation}</strong>
        </div>
        <div className="border border-[#d8d9d0] bg-paper p-4">
          <span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Launch readiness</span>
          <strong className="mt-2 block font-display text-lg leading-tight text-moss">{audit.launchReadiness}</strong>
          <span className={`mt-2 inline-block font-mono text-[9px] uppercase tracking-[.08em] ${scoreTone.badge.split(' ')[1]}`}>{scoreTone.label}</span>
        </div>
      </div>

      <div className="grid gap-8 py-7 lg:grid-cols-2">
        <div className="space-y-7">
          <section>
            <SectionLabel>Tech stack</SectionLabel>
            <BadgeList items={technologies} emptyLabel="No technologies detected" />
            <p className="mt-3 text-xs text-[#687269]">Runtime: {audit.techStackDetails.runtime}</p>
          </section>

          <section>
            <SectionLabel>Completed core features</SectionLabel>
            {audit.projectCompleteness.completedFeatures.length ? (
              <ul className="space-y-2 text-sm text-[#435248]">
                {audit.projectCompleteness.completedFeatures.map((feature) => <li className="flex gap-2" key={feature}><span className="text-coral">+</span><span>{feature}</span></li>)}
              </ul>
            ) : <span className="text-sm text-[#879188]">No completed features detected</span>}
          </section>

          <section>
            <SectionLabel>Third-party API integrations</SectionLabel>
            <BadgeList items={audit.dependencyAudit.paidApiIntegrations} emptyLabel="No paid APIs detected" />
          </section>
        </div>

        <section className="border-l-0 border-[#d8d9d0] lg:border-l lg:pl-8">
          <SectionLabel>Risk &amp; security</SectionLabel>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 border-b border-[#d8d9d0] pb-3 text-sm">
              <span className="text-[#657067]">License</span>
              <strong className="font-display text-moss">{audit.riskAndSecurity.licenseType}</strong>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-[#d8d9d0] pb-3 text-sm">
              <span className="text-[#657067]">Environment template</span>
              <strong className={audit.riskAndSecurity.hasEnvExample ? 'text-[#21563e]' : 'text-[#8b3d2b]'}>{audit.riskAndSecurity.hasEnvExample ? 'Found' : 'Missing'}</strong>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-[#d8d9d0] pb-3 text-sm">
              <span className="text-[#657067]">Documentation</span>
              <strong className="font-display text-moss">{audit.projectCompleteness.documentationRating}</strong>
            </div>
            <div className="pt-2">
              <span className="mb-3 block font-mono text-[10px] uppercase tracking-[.1em] text-[#7b837b]">Risk flags</span>
              <BadgeList items={audit.riskAndSecurity.riskFlags} emptyLabel="No risk flags detected" tone="danger" />
            </div>
          </div>
        </section>
      </div>

      <details className="border-t border-[#d8d9d0] pt-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-sm font-semibold text-moss marker:hidden">
          <span>Full dependency breakdown <span className="ml-2 font-mono text-[10px] font-normal text-[#879188]">{audit.dependencyAudit.totalDependencies} total</span></span>
          <span className="font-mono text-coral">+</span>
        </summary>
        <div className="mt-4 border border-[#d8d9d0] bg-paper p-4">
          <SectionLabel>Deprecated or outdated packages</SectionLabel>
          <BadgeList items={audit.dependencyAudit.deprecatedOrOutdated} emptyLabel="No outdated packages detected" tone="danger" />
        </div>
      </details>
    </article>
  );
}
