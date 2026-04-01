'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Scanlines } from '@/components/portal-ui';

interface SessionSummary {
  topics: string[];
  user_positions: string[];
  aristotle_challenges: string[];
  growth_notes: string;
  session_number: number;
  timestamp: string;
}

type Tab = 'sessions' | 'letters' | 'growth';

export default function JourneyPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('sessions');
  const [summaries, setSummaries] = useState<SessionSummary[]>([]);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const touchStartX = useRef(0);

  useEffect(() => {
    const stored = localStorage.getItem('stotl-summaries');
    if (stored) setSummaries(JSON.parse(stored));
    const msgs = localStorage.getItem('stotl-messages');
    if (msgs) setMessages(JSON.parse(msgs));
  }, []);

  // Swipe right to go back to conversation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 80) router.push('/');
  }, [router]);

  const totalTurns = messages.length;
  const sessionCount = summaries.length || (totalTurns > 0 ? 1 : 0);
  const totalMinutes = Math.round(totalTurns * 1.3); // rough estimate: ~1.3 min per turn

  return (
    <div className="h-screen flex flex-col max-w-[500px] mx-auto relative"
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
      style={{ backgroundColor: '#0d0b09' }}>
      <Scanlines />

      {/* Header */}
      <div className="pt-14 pb-4 px-6 text-center">
        <h1 className="text-[16px] tracking-[6px] uppercase" style={{ color: 'var(--gold)' }}>
          Your Journey
        </h1>
        <p className="text-[11px] font-sans mt-1.5" style={{ color: 'var(--text-ghost)' }}>
          {sessionCount} session{sessionCount !== 1 ? 's' : ''} · {totalMinutes}m with Aristotle
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {(['sessions', 'letters', 'growth'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-center text-[10px] tracking-[2px] uppercase font-sans transition-colors"
            style={{
              color: tab === t ? 'var(--gold)' : 'var(--text-ghost)',
              borderBottom: tab === t ? '1px solid var(--gold)' : '1px solid transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-4">

        {/* Sessions tab */}
        {tab === 'sessions' && (
          <>
            {summaries.length === 0 && totalTurns === 0 ? (
              <EmptyState
                title="Begin your journey"
                subtitle="Return to converse with Aristotle. Your sessions will appear here."
                action={() => router.push('/')}
                actionLabel="Start a conversation"
              />
            ) : (
              <>
                {summaries.length > 0 ? (
                  summaries.slice().reverse().map((s, i) => (
                    <SessionCard key={i} summary={s} />
                  ))
                ) : (
                  <div className="py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="text-[10px] tracking-[2px] font-sans" style={{ color: 'var(--text-ghost)' }}>
                      Current session · {totalTurns} exchanges
                    </div>
                    <div className="text-[17px] mt-2" style={{ color: 'var(--text-high)' }}>
                      In Progress
                    </div>
                    <div className="text-[13px] mt-1.5 italic" style={{ color: 'var(--text-low)' }}>
                      Keep talking. Your first summary will appear after 5 exchanges.
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Letters tab */}
        {tab === 'letters' && (
          <>
            {summaries.length >= 2 ? (
              <LetterFromAristotle summaries={summaries} />
            ) : (
              <EmptyState
                title="No letters yet"
                subtitle={`Aristotle writes you a letter after 10 sessions. You've had ${sessionCount}. Keep going.`}
              />
            )}
          </>
        )}

        {/* Growth tab */}
        {tab === 'growth' && (
          <>
            {summaries.length >= 2 ? (
              <GrowthView summaries={summaries} />
            ) : (
              <EmptyState
                title="Not enough data yet"
                subtitle="Your intellectual growth map appears after a few sessions. Aristotle needs to see how your thinking evolves."
              />
            )}
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div className="flex border-t py-4 px-6" style={{ borderColor: 'var(--border)' }}>
        <button onClick={() => router.push('/')} className="flex-1 text-center text-[9px] tracking-[2px] uppercase font-sans"
          style={{ color: 'var(--text-ghost)' }}>
          Converse
        </button>
        <button className="flex-1 text-center text-[9px] tracking-[2px] uppercase font-sans"
          style={{ color: 'var(--gold)' }}>
          Journey
        </button>
      </div>

      {/* Swipe hint */}
      <div className="flex justify-center gap-1.5 pb-8">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--text-void)' }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--gold)', opacity: 0.6 }} />
      </div>
    </div>
  );
}

function SessionCard({ summary }: { summary: SessionSummary }) {
  const date = new Date(summary.timestamp);
  return (
    <div className="py-4 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="text-[10px] tracking-[2px] font-sans" style={{ color: 'var(--text-ghost)' }}>
        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
      <div className="text-[17px] mt-2" style={{ color: 'var(--text-high)' }}>
        {summary.topics.join(', ') || 'Conversation'}
      </div>
      <div className="text-[13px] mt-1.5 italic leading-relaxed" style={{ color: 'var(--text-low)' }}>
        {summary.growth_notes}
      </div>
      <div className="flex gap-2 mt-2.5">
        {summary.user_positions.slice(0, 2).map((pos, i) => (
          <span key={i} className="text-[9px] tracking-[1px] font-sans px-2 py-0.5 border rounded-sm"
            style={{ color: 'var(--text-ghost)', borderColor: 'var(--text-void)' }}>
            {pos.length > 40 ? pos.slice(0, 40) + '...' : pos}
          </span>
        ))}
      </div>
    </div>
  );
}

function LetterFromAristotle({ summaries }: { summaries: SessionSummary[] }) {
  // Generate a letter preview from the summaries (real letter comes from API in Phase 2)
  const topics = summaries.flatMap(s => s.topics).slice(0, 5);
  const positions = summaries.flatMap(s => s.user_positions).slice(0, 3);

  return (
    <div className="mt-4 p-5 border rounded" style={{ borderColor: 'var(--text-ghost)', backgroundColor: 'var(--bg-surface)' }}>
      <div className="text-[10px] tracking-[3px] uppercase mb-3" style={{ color: 'var(--gold)' }}>
        A Letter from Aristotle
      </div>
      <div className="text-[14px] leading-[1.8] italic" style={{ color: 'var(--text-mid)' }}>
        "Dear friend, over these past sessions you have shown me something I did not expect.
        Your questions about {topics[0] || 'the nature of things'} have deepened in a way that
        reminds me of my finest students. You argued that {positions[0] || 'truth requires courage'},
        and when I challenged you, you did not retreat. That is rare.
        I look forward to our next conversation. There is much more to discuss."
      </div>
      <div className="text-[11px] mt-4 text-right" style={{ color: 'var(--gold-dim)' }}>
        — Aristotle, after {summaries.length} sessions
      </div>
    </div>
  );
}

function GrowthView({ summaries }: { summaries: SessionSummary[] }) {
  // Simple text-based growth view (visual chart in Phase 2)
  return (
    <div className="mt-2">
      <div className="text-[11px] tracking-[2px] uppercase font-sans mb-4" style={{ color: 'var(--gold-dim)' }}>
        Topics Explored
      </div>
      {summaries.map((s, i) => (
        <div key={i} className="flex items-start gap-3 mb-4">
          <div className="text-[10px] font-sans mt-1 shrink-0" style={{ color: 'var(--text-void)', width: '24px' }}>
            {s.session_number}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5">
              {s.topics.map((topic, j) => (
                <span key={j} className="text-[11px] px-2 py-0.5 rounded-sm"
                  style={{ backgroundColor: 'rgba(196,162,101,0.08)', color: 'var(--gold-dim)' }}>
                  {topic}
                </span>
              ))}
            </div>
            {s.growth_notes && (
              <div className="text-[12px] italic mt-1" style={{ color: 'var(--text-low)' }}>
                {s.growth_notes}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, subtitle, action, actionLabel }: {
  title: string; subtitle: string; action?: () => void; actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
      <div className="signal-line mb-6" />
      <h2 className="text-[17px]" style={{ color: 'var(--text-mid)' }}>{title}</h2>
      <p className="text-[13px] mt-2 leading-relaxed italic" style={{ color: 'var(--text-low)' }}>
        {subtitle}
      </p>
      {action && actionLabel && (
        <button onClick={action} className="mt-6 px-5 py-2 text-[11px] tracking-[2px] uppercase font-sans border rounded"
          style={{ borderColor: 'var(--gold-dim)', color: 'var(--gold)' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
