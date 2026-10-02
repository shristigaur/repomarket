import React, { useState } from 'react';
import { X, Sparkles, Loader2, GitBranch, DollarSign, CheckCircle2, AlertCircle, BarChart3, Star } from 'lucide-react';
import { apiFetch } from '../api';

export default function ListRepoModal({ isOpen, onClose, onSuccess }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [askingPrice, setAskingPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!repoUrl) {
      setError('Please enter a GitHub repository URL.');
      return;
    }
    setError('');
    setIsAnalyzing(true);
    setAiReport(null);

    try {
      const response = await apiFetch('/listings/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl, userPrice: Number(askingPrice) || 0 })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to analyze repository');
      }

      const data = await response.json();
      setAiReport(data);
      if (data.estimatedPrice) {
        setAskingPrice(data.estimatedPrice.toString());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!aiReport) {
      setError('Please analyze the repository first.');
      return;
    }
    if (!askingPrice || isNaN(Number(askingPrice)) || Number(askingPrice) < 0) {
      setError('Please enter a valid asking price.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const repoNameParts = repoUrl.split('/');
      const repoName = repoNameParts[repoNameParts.length - 1] || 'My Repository';
      const payload = {
        repoUrl,
        repoName,
        description: aiReport.summary || 'A repository listing',
        userPrice: Number(askingPrice),
        aiEstimatedPrice: aiReport.estimatedPrice,
        aiRating: aiReport.rating,
        aiAnalysis: {
          summary: aiReport.summary,
          breakdown: aiReport.breakdown,
          priceRange: aiReport.priceRange
        }
      };

      const res = await apiFetch('/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to publish listing');
      }

      setSuccess('Listing published successfully!');
      setTimeout(() => {
        setSuccess('');
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-[#d8d9d0] bg-paper shadow-[8px_8px_0_#2b3d2b] transition-all">
        <div className="flex items-center justify-between border-b border-[#d8d9d0] bg-sage/30 px-6 py-4">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-moss">
            <GitBranch className="h-6 w-6" /> List a Repository
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-moss/60 transition-colors hover:bg-moss/10 hover:text-moss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-6">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-coral/30 bg-coral/5 p-4 text-coral">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-moss/30 bg-moss/5 p-4 text-moss">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-moss">
                GitHub Repository URL
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  placeholder="https://github.com/username/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  disabled={isAnalyzing || isSubmitting || success !== ''}
                  className="flex-1 rounded-none border border-[#d8d9d0] bg-white px-4 py-2.5 font-sans text-sm text-ink focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss disabled:opacity-50"
                />
                <button
                  onClick={handleAnalyze}
                  disabled={!repoUrl || isAnalyzing || isSubmitting || success !== ''}
                  className="flex items-center gap-2 whitespace-nowrap bg-moss px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-paper transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#dc6f48] disabled:pointer-events-none disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Analyze with AI</>
                  )}
                </button>
              </div>
            </div>

            {aiReport && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative overflow-hidden rounded-lg border border-moss/20 bg-gradient-to-br from-sage/20 to-white p-6 shadow-sm">
                  <div className="absolute -right-4 -top-4 text-moss/5">
                    <Sparkles className="h-32 w-32" />
                  </div>
                  
                  <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-moss">
                    <BarChart3 className="h-5 w-5" /> AI Evaluation Report
                  </h3>
                  
                  <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-md border border-[#d8d9d0] bg-white p-4">
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-moss/70">AI Rating</p>
                      <div className="flex items-center gap-1 text-coral">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-5 w-5 ${star <= (aiReport.aiRating || 0) / 2 ? 'fill-current' : 'opacity-30'}`} 
                          />
                        ))}
                        <span className="ml-2 font-display font-bold text-ink">
                          {aiReport.aiRating ? `${aiReport.aiRating}/10` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="rounded-md border border-[#d8d9d0] bg-white p-4">
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-moss/70">Suggested Market Price</p>
                      <p className="font-display text-2xl font-bold text-moss">
                        ${aiReport.aiEstimatedPrice?.toLocaleString() || '---'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md border border-[#d8d9d0] bg-white p-4">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-moss/70">Analysis Reasoning</p>
                    <p className="text-sm leading-relaxed text-ink/80">
                      {aiReport.aiAnalysisReasoning || 'The AI found this repository to be standard with no specific reasoning provided.'}
                    </p>
                    
                    {aiReport.repoInfo && (
                      <div className="mt-4 flex flex-wrap gap-3 border-t border-[#d8d9d0] pt-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-sage/40 px-2.5 py-1 text-xs font-medium text-moss">
                          <Star className="h-3 w-3" /> {aiReport.repoInfo.stars} Stars
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-sage/40 px-2.5 py-1 text-xs font-medium text-moss">
                          <GitBranch className="h-3 w-3" /> {aiReport.repoInfo.forks} Forks
                        </span>
                        {aiReport.repoInfo.language && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sage/40 px-2.5 py-1 text-xs font-medium text-moss">
                            <span className="h-2 w-2 rounded-full bg-coral"></span> {aiReport.repoInfo.language}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-moss">
                    Your Asking Price ($USD)
                  </label>
                  <div className="relative max-w-[200px]">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-moss/60">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={askingPrice}
                      onChange={(e) => setAskingPrice(e.target.value)}
                      disabled={isSubmitting || success !== ''}
                      className="w-full rounded-none border border-[#d8d9d0] bg-white py-2.5 pl-9 pr-4 font-sans text-sm font-medium text-ink focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-ink/60">
                    You can use the AI's suggested price or set your own.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-[#d8d9d0] bg-sage/10 px-6 py-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="font-mono text-xs font-semibold uppercase tracking-wider text-moss transition-colors hover:text-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!aiReport || isSubmitting || success !== ''}
            className="flex items-center gap-2 bg-coral px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#2b3d2b] disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Publishing</>
            ) : (
              'Publish Listing'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
