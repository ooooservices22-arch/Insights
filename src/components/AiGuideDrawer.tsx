import React, { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Lightbulb, MessageSquare, Send, X } from 'lucide-react';
import type { FeatureRequest, GroundingSource } from '../types';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  sources?: GroundingSource[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  contextSection: string;
  locationLabel: string;
  prefillQuestion?: string | null;
  onClearPrefill?: () => void;
  onFeatureRequested?: (req: FeatureRequest) => void;
}

const QUICK_PROMPTS = [
  'Translate "hydrostatic uplift & French drain sump tie-in" for my insurance call',
  'How do I prevent organic growth / mold spores from contaminating my house?',
  'Step-by-step rebuild & coil maintenance guide for a used commercial dehumidifier',
  'How to set up smart water shutoff & humidity alerts while on vacation',
];

export const AiGuideDrawer: React.FC<Props> = ({
  open,
  onClose,
  contextSection,
  locationLabel,
  prefillQuestion,
  onClearPrefill,
  onFeatureRequested,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Ask anything about organic growth prevention, smart vacation alerts, equipment rebuilds, water filtration, contractor quotes, insurance terminology, or navigating insights. If you ask for something not supported yet, use "Request Unsupported Feature" below to queue it right away.',
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Inline unsupported feature request workflow
  const [requestFormOpen, setRequestFormOpen] = useState<boolean>(false);
  const [reqTitle, setReqTitle] = useState<string>('');
  const [reqDesc, setReqDesc] = useState<string>('');
  const [reqCategory, setReqCategory] = useState<FeatureRequest['category']>('Diagnostics & AI');
  const [reqUser, setReqUser] = useState<string>('');
  const [reqSubmitting, setReqSubmitting] = useState<boolean>(false);
  const [reqResult, setReqResult] = useState<string | null>(null);

  const openFeatureRequestFromChat = (seedText?: string) => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.text || '';
    const base = seedText || lastUserMsg || input;
    if (base && !reqTitle) {
      setReqTitle(base.slice(0, 80));
      setReqDesc(base);
    }
    setReqResult(null);
    setRequestFormOpen((prev) => !prev);
  };

  const handleSubmitFeatureRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim() || !reqDesc.trim()) return;
    setReqSubmitting(true);
    setReqResult(null);
    try {
      const res = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reqTitle.trim(),
          description: reqDesc.trim(),
          category: reqCategory,
          requestedBy: reqUser.trim() || 'Community Member',
          locationContext: `Asked in ${contextSection} (${locationLabel})`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not queue feature request.');
      const created = data as FeatureRequest;
      onFeatureRequested?.(created);
      setReqTitle('');
      setReqDesc('');
      setReqResult(`Logged "${created.title}" (${created.status}). ${created.aiScopeNote || ''}`);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Feature Request Logged (${created.status}): "${created.title}"\n${
            created.aiScopeNote ? `Engineering Scope: ${created.aiScopeNote}\n` : ''
          }You can upvote and track it in Community Glass Wall -> Feature Requests.`,
        },
      ]);
      setRequestFormOpen(false);
    } catch (err) {
      setReqResult(err instanceof Error ? err.message : 'Unable to submit feature request.');
    } finally {
      setReqSubmitting(false);
    }
  };

  const sendQuestion = async (q: string) => {
    if (!q.trim() || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          contextSection,
          locationLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get response.');
      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer, sources: data.sources }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: err instanceof Error ? err.message : 'Unable to connect to AI Guide.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && prefillQuestion) {
      sendQuestion(prefillQuestion);
      onClearPrefill?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillQuestion]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex justify-end">
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 h-full border-l border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">insights AI Guide &amp; How-To Assistant</h2>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Grounded advice · {locationLabel}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => sendQuestion(p)}
                className="text-left text-[11px] px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-lg text-xs leading-relaxed space-y-2 ${
                m.role === 'user'
                  ? 'bg-slate-900 dark:bg-amber-600 text-white ml-8'
                  : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 mr-4'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              {m.sources && m.sources.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                  {m.sources.map((s, sIdx) => (
                    <a
                      key={sIdx}
                      href={s.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {s.title}
                    </a>
                  ))}
                </div>
              )}
              {m.role === 'assistant' && idx > 0 && (
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Missing a tool or live data feed?
                  </span>
                  <button
                    type="button"
                    onClick={() => openFeatureRequestFromChat(messages[idx - 1]?.role === 'user' ? messages[idx - 1].text : undefined)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
                  >
                    <Lightbulb className="w-3 h-3" />
                    Request Feature
                  </button>
                </div>
              )}
            </div>
          ))}
          {loading && <div className="text-xs text-slate-500">Verifying codes and drafting guidance...</div>}

          {reqResult && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{reqResult}</span>
            </div>
          )}

          {requestFormOpen && (
            <form
              onSubmit={handleSubmitFeatureRequest}
              className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900 rounded-lg space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  Request Unsupported Feature
                </div>
                <button
                  type="button"
                  onClick={() => setRequestFormOpen(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <input
                type="text"
                required
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
                placeholder="Feature name (e.g. Live radon sensor bridge)"
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
              />
              <textarea
                rows={2}
                required
                value={reqDesc}
                onChange={(e) => setReqDesc(e.target.value)}
                placeholder="Describe what you asked for that isn't supported yet..."
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value as FeatureRequest['category'])}
                  className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                >
                  <option value="Diagnostics & AI">Diagnostics &amp; AI</option>
                  <option value="Hazards & Weather">Hazards &amp; Weather</option>
                  <option value="Contractor Verification">Contractor Verification</option>
                  <option value="Store & Rentals">Store &amp; Rentals</option>
                  <option value="Public Database & Offline">Public Database &amp; Offline</option>
                  <option value="Other Unsupported Feature">Other Unsupported Feature</option>
                </select>
                <input
                  type="text"
                  value={reqUser}
                  onChange={(e) => setReqUser(e.target.value)}
                  placeholder="Your name / alias"
                  className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={reqSubmitting}
                className="w-full py-1.5 px-3 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded"
              >
                {reqSubmitting ? 'Scoping & Queueing...' : 'Submit Unsupported Feature Request'}
              </button>
            </form>
          )}
        </div>

        <div className="px-4 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => openFeatureRequestFromChat()}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {requestFormOpen ? 'Hide Feature Request Form' : 'Request an unsupported feature when asked'}
          </button>
          <span className="text-[11px] text-slate-400">Open roadmap</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(input);
          }}
          className="p-4 pt-2 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask any how-to, rebuild, mold, or insurance question..."
            className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
          <button
            type="submit"
            disabled={loading}
            className="p-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
            aria-label="Send question"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </aside>
    </div>
  );
};
