'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getClass, verifyTeacherPassword, getClassSessions, getLearnMessages } from '@/lib/learn-db';
import type { Class, ClassSessionWithStudent, LearnMessage } from '@/lib/learn-db';
import { getPersona } from '@/lib/personas';

// --- Verdict badge config ---

const VERDICT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'Understood':   { bg: '#dcfce7', text: '#166534', label: 'Understood' },
  'Promising':    { bg: '#dbeafe', text: '#1e40af', label: 'Promising' },
  'Partial':      { bg: '#fef3c7', text: '#92400e', label: 'Partial' },
  'Not Yet':      { bg: '#fee2e2', text: '#991b1b', label: 'Not Yet' },
  'In Progress':  { bg: '#f3f4f6', text: '#6b7280', label: 'In Progress' },
};

function VerdictBadge({ verdict }: { verdict: string | null }) {
  const style = VERDICT_STYLES[verdict || 'In Progress'] || VERDICT_STYLES['In Progress'];
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}

// --- Metacognition gap bar ---

function MetacognitionGap({ studentRating, philosopherRating }: { studentRating: number | null; philosopherRating: number | null }) {
  if (studentRating === null || philosopherRating === null) return null;

  return (
    <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        Metacognition Gap
      </p>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Student rated</span>
            <span>{studentRating}/5</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(studentRating / 5) * 100}%`,
                backgroundColor: '#60a5fa',
              }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Philosopher rated</span>
            <span>{philosopherRating}/5</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(philosopherRating / 5) * 100}%`,
                backgroundColor: '#9f7a43',
              }}
            />
          </div>
        </div>
      </div>
      {Math.abs(studentRating - philosopherRating) >= 2 && (
        <p className="text-xs text-amber-600 mt-2">
          Significant gap detected ({studentRating > philosopherRating ? 'student overestimates' : 'student underestimates'} understanding)
        </p>
      )}
    </div>
  );
}

// --- Duration helper ---

function formatDuration(startedAt: string, completedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const mins = Math.round((end - start) / 60000);
  if (mins < 1) return '<1 min';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

// --- Session row ---

function SessionRow({ session }: { session: ClassSessionWithStudent }) {
  const [expanded, setExpanded] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [messages, setMessages] = useState<LearnMessage[] | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadTranscript = useCallback(async () => {
    if (messages) {
      setShowTranscript(true);
      return;
    }
    setLoadingMessages(true);
    try {
      const msgs = await getLearnMessages(session.id);
      setMessages(msgs);
      setShowTranscript(true);
    } catch {
      // silently fail
    } finally {
      setLoadingMessages(false);
    }
  }, [session.id, messages]);

  const totalTurns = (session.teaching_turns || 0) + (session.exam_turns || 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium text-gray-900">
              {session.student_code}
            </span>
            {session.student_name && (
              <span className="text-sm text-gray-500 truncate">
                {session.student_name}
              </span>
            )}
          </div>
        </div>
        <VerdictBadge verdict={session.verdict_badge} />
        <span className="text-xs text-gray-400 w-16 text-right">
          {formatDuration(session.started_at, session.completed_at)}
        </span>
        <span className="text-xs text-gray-400 w-16 text-right">
          {totalTurns} turn{totalTurns !== 1 ? 's' : ''}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {/* Assessment letter */}
          {session.assessment_letter && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Assessment
              </p>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-100">
                {session.assessment_letter}
              </div>
            </div>
          )}

          {/* Metacognition gap */}
          <MetacognitionGap
            studentRating={session.self_assessment_score}
            philosopherRating={session.philosopher_rating}
          />

          {/* Transcript toggle */}
          <div className="mt-4">
            {!showTranscript ? (
              <button
                onClick={loadTranscript}
                disabled={loadingMessages}
                className="text-sm font-medium transition-colors hover:underline disabled:opacity-50"
                style={{ color: '#9f7a43' }}
              >
                {loadingMessages ? 'Loading transcript...' : 'View full transcript'}
              </button>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Transcript
                  </p>
                  <button
                    onClick={() => setShowTranscript(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Hide
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto rounded-lg border border-gray-100 p-3 bg-gray-50">
                  {messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`text-sm rounded-lg px-3 py-2 ${
                        msg.role === 'user'
                          ? 'bg-blue-50 text-blue-900 ml-8'
                          : 'bg-white text-gray-700 mr-8 border border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                          {msg.role === 'user' ? 'Student' : 'Philosopher'}
                        </span>
                        <span className="text-[10px] text-gray-300">
                          {msg.phase}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ))}
                  {messages?.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No messages yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main page ---

export default function TeacherDashboardPage() {
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');

  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [sessions, setSessions] = useState<ClassSessionWithStudent[]>([]);
  const [loading, setLoading] = useState(false);

  // Load class data after auth
  const loadDashboard = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const [cls, sess] = await Promise.all([
        getClass(classId),
        getClassSessions(classId),
      ]);
      setClassInfo(cls);
      setSessions(sess);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const handleAuth = async () => {
    if (!classId || !password.trim()) return;
    setIsVerifying(true);
    setAuthError(null);

    try {
      const valid = await verifyTeacherPassword(classId, password.trim());
      if (valid) {
        setAuthenticated(true);
      } else {
        setAuthError('Incorrect password. Please try again.');
      }
    } catch {
      setAuthError('Something went wrong. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadDashboard();
    }
  }, [authenticated, loadDashboard]);

  // No classId in URL
  if (!classId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8f8f8', fontFamily: 'system-ui, sans-serif' }}>
        <div className="text-center px-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">No class selected</h1>
          <p className="text-gray-500 mb-6">
            You need a class link to view the dashboard.
          </p>
          <a
            href="/teacher/create"
            className="inline-block px-5 py-2.5 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: '#9f7a43' }}
          >
            Create a Class
          </a>
        </div>
      </div>
    );
  }

  // Password gate
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8f8f8', fontFamily: 'system-ui, sans-serif' }}>
        <div className="w-full max-w-sm px-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-1 text-center">Teacher Dashboard</h1>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Enter your dashboard password to view student progress.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAuth();
            }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dashboard password"
              autoFocus
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 text-base focus:outline-none focus:border-[#9f7a43] focus:ring-1 focus:ring-[#9f7a43] mb-3"
            />

            {authError && (
              <p className="text-sm text-red-600 mb-3">{authError}</p>
            )}

            <button
              type="submit"
              disabled={!password.trim() || isVerifying}
              className="w-full px-5 py-3 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-40"
              style={{ backgroundColor: '#9f7a43' }}
            >
              {isVerifying ? 'Verifying...' : 'View Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8f8f8', fontFamily: 'system-ui, sans-serif' }}>
        <p className="text-gray-400 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  const philosopher = classInfo ? getPersona(classInfo.philosopher_id) : null;
  const studentUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/learn?classId=${classId}`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f8f8', fontFamily: 'system-ui, sans-serif' }}>
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Teacher Dashboard</h1>
            {classInfo && philosopher && (
              <p className="text-gray-500">
                {philosopher.name} &middot; {classInfo.topic_id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </p>
            )}
          </div>
          <button
            onClick={loadDashboard}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300"
          >
            Refresh
          </button>
        </div>

        {/* Sessions list */}
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h2>
            <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
              Your students will appear here as they start learning with{' '}
              <span className="font-medium">{philosopher?.name || 'the philosopher'}</span>.
              Share this link:
            </p>
            <code className="inline-block text-sm font-mono px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 break-all mb-3">
              {studentUrl}
            </code>
            <p className="text-xs text-gray-400">
              Tip: Students get a personal code on their first visit.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Column headers */}
            <div className="px-5 flex items-center gap-4 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <div className="flex-1">Student</div>
              <div className="w-24">Verdict</div>
              <div className="w-16 text-right">Duration</div>
              <div className="w-16 text-right">Turns</div>
              <div className="w-4" />
            </div>

            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
