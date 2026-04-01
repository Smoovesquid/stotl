'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  totalSessions: number;
  totalTurns: number;
  summaries: number;
  avgTurnsPerSession: number;
  topics: Record<string, number>;
  lastActive: string | null;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  // Simple password gate (real auth comes with Supabase)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'stotl') {
      setAuthenticated(true);
    }
  };

  useEffect(() => {
    if (!authenticated) return;

    // Read from localStorage (Supabase queries in Phase 2)
    const msgs = JSON.parse(localStorage.getItem('stotl-messages') || '[]');
    const summaries = JSON.parse(localStorage.getItem('stotl-summaries') || '[]');

    const topics: Record<string, number> = {};
    for (const s of summaries) {
      for (const t of (s.topics || [])) {
        topics[t] = (topics[t] || 0) + 1;
      }
    }

    setData({
      totalSessions: summaries.length || (msgs.length > 0 ? 1 : 0),
      totalTurns: msgs.filter((m: { role: string }) => m.role === 'user').length,
      summaries: summaries.length,
      avgTurnsPerSession: summaries.length > 0
        ? Math.round(msgs.filter((m: { role: string }) => m.role === 'user').length / Math.max(summaries.length, 1))
        : msgs.filter((m: { role: string }) => m.role === 'user').length,
      topics,
      lastActive: msgs.length > 0 ? new Date().toISOString() : null,
    });
  }, [authenticated]);

  if (!authenticated) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#0d0b09' }}>
        <form onSubmit={handleLogin} className="text-center">
          <h1 className="text-[14px] tracking-[6px] uppercase mb-8" style={{ color: 'var(--gold)' }}>
            Stotl Admin
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="bg-transparent border rounded px-4 py-2 text-[14px] font-sans text-center focus:outline-none focus:border-[#4a3e2a]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-mid)' }}
            autoFocus
          />
        </form>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen p-8 max-w-[600px] mx-auto" style={{ backgroundColor: '#0d0b09' }}>
      <h1 className="text-[14px] tracking-[6px] uppercase mb-8" style={{ color: 'var(--gold)' }}>
        Stotl — Founder Dashboard
      </h1>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <MetricCard label="Sessions" value={data.totalSessions} />
        <MetricCard label="User Turns" value={data.totalTurns} />
        <MetricCard label="Avg Turns / Session" value={data.avgTurnsPerSession} />
        <MetricCard label="Summaries" value={data.summaries} />
      </div>

      {/* Anti-engagement metrics */}
      <div className="mb-8">
        <h2 className="text-[11px] tracking-[3px] uppercase font-sans mb-4" style={{ color: 'var(--gold-dim)' }}>
          Quality of Return
        </h2>
        <div className="p-4 border rounded" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}>
          <div className="text-[13px] font-sans" style={{ color: 'var(--text-mid)' }}>
            Return rate: <span style={{ color: 'var(--gold)' }}>
              {data.totalSessions > 1 ? 'Returning user' : 'First session'}
            </span>
          </div>
          <div className="text-[13px] font-sans mt-2" style={{ color: 'var(--text-mid)' }}>
            Depth score: <span style={{ color: 'var(--gold)' }}>
              {data.avgTurnsPerSession} turns/session
            </span>
          </div>
          <div className="text-[13px] font-sans mt-2" style={{ color: 'var(--text-mid)' }}>
            Last active: <span style={{ color: 'var(--gold)' }}>
              {data.lastActive ? new Date(data.lastActive).toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Topics */}
      {Object.keys(data.topics).length > 0 && (
        <div className="mb-8">
          <h2 className="text-[11px] tracking-[3px] uppercase font-sans mb-4" style={{ color: 'var(--gold-dim)' }}>
            Topics Discussed
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.topics).sort((a, b) => b[1] - a[1]).map(([topic, count]) => (
              <span key={topic} className="text-[12px] font-sans px-3 py-1 rounded"
                style={{ backgroundColor: 'rgba(196,162,101,0.08)', color: 'var(--gold-dim)' }}>
                {topic} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="text-[10px] font-sans mt-12" style={{ color: 'var(--text-void)' }}>
        Phase 1 dashboard. Supabase multi-user analytics in Phase 2.
        <br />Data source: localStorage (single device).
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 border rounded" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}>
      <div className="text-[9px] tracking-[2px] uppercase font-sans" style={{ color: 'var(--text-ghost)' }}>
        {label}
      </div>
      <div className="text-[28px] font-light mt-1" style={{ color: 'var(--gold)' }}>
        {value}
      </div>
    </div>
  );
}
