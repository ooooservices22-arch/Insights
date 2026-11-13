import React, { useState } from 'react';
import { ExternalLink, MessageSquare, Send, X } from 'lucide-react';
import type { GroundingSource } from '../types';

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
}

const QUICK_PROMPTS = [
  'Translate "hydrostatic uplift & French drain sump tie-in" for my insurance call',
  'What should I ask a contractor before paying a deposit?',
  'How do I document apartment mold so management cannot just paint over it?',
  'Explain IICRC S500 water damage Category 1 vs Category 3',
];

export const AiGuideDrawer: React.FC<Props> = ({ open, onClose, contextSection, locationLabel }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Ask anything about contractor quotes, insurance policy terminology, IICRC remediation standards, soil/groundwater testing, or navigating insights.',
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!open) return null;

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex justify-end">
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 h-full border-l border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">insights AI Guide & Verbiage Coach</h2>
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
            </div>
          ))}
          {loading && <div className="text-xs text-slate-500">Verifying codes and drafting plain-English guidance...</div>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(input);
          }}
          className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about quotes, insurance terms, or codes..."
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
