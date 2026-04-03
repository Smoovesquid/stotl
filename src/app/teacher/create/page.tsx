'use client';

import { useState } from 'react';
import { createClass } from '@/lib/learn-db';
import { PERSONAS, getPersona } from '@/lib/personas';

// Topic shape matching what's in personas/topics/
interface Topic {
  id: string;
  title: string;
  description: string;
  sourceText: string;
}

// Hard-coded topic lists per philosopher until topics are wired into PERSONAS
const PHILOSOPHER_TOPICS: Record<string, Topic[]> = {
  aristotle: [
    { id: 'virtue-ethics', title: 'Virtue Ethics', description: 'What makes a good person? The golden mean between excess and deficiency.', sourceText: 'Nicomachean Ethics, Books I-II' },
    { id: 'comedy-tragedy', title: 'Comedy & Tragedy', description: 'Why do humans need art? The structure of dramatic storytelling.', sourceText: 'Poetics' },
    { id: 'good-life', title: 'The Good Life', description: 'Eudaimonia — flourishing as the purpose of human existence.', sourceText: 'Nicomachean Ethics, Book X' },
    { id: 'political-animals', title: 'Political Animals', description: 'Why humans are meant to live in communities. The purpose of the state.', sourceText: 'Politics, Book I' },
  ],
  plato: [
    { id: 'allegory-cave', title: 'The Allegory of the Cave', description: 'Shadows, chains, and the blinding light of truth.', sourceText: 'Republic, Book VII' },
    { id: 'theory-forms', title: 'Theory of Forms', description: 'The real world behind the world we see.', sourceText: 'Phaedo; Republic, Books V-VII' },
    { id: 'just-city', title: 'The Just City', description: 'What would a perfectly just society look like?', sourceText: 'Republic, Books II-IV' },
    { id: 'nature-of-love', title: 'The Nature of Love', description: 'Eros, beauty, and the ascent of the soul.', sourceText: 'Symposium' },
  ],
};

const PHILOSOPHERS = [
  { id: 'aristotle', name: 'Aristotle', years: '384-322 BC' },
  { id: 'plato', name: 'Plato', years: '428-348 BC' },
];

export default function TeacherCreatePage() {
  const [selectedPhilosopher, setSelectedPhilosopher] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdClassId, setCreatedClassId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const topics = selectedPhilosopher ? PHILOSOPHER_TOPICS[selectedPhilosopher] || [] : [];

  const handleCreate = async () => {
    if (!selectedPhilosopher || !selectedTopic || !password.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const classRecord = await createClass(selectedPhilosopher, selectedTopic, password.trim());
      setCreatedClassId(classRecord.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to create class. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const studentUrl = createdClassId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/learn?classId=${createdClassId}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(studentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
      const el = document.getElementById('student-url');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  };

  // Success state: show the shareable link
  if (createdClassId) {
    const philosopher = PHILOSOPHERS.find((p) => p.id === selectedPhilosopher);
    const topic = topics.find((t) => t.id === selectedTopic);

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f8f8f8', fontFamily: 'system-ui, sans-serif' }}>
        <div className="max-w-[900px] mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#9f7a4315' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9f7a43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Class Created</h1>
            <p className="text-gray-500">
              {philosopher?.name} &middot; {topic?.title}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Share this link with your students
            </p>
            <div className="flex items-center gap-3">
              <code
                id="student-url"
                className="flex-1 block text-lg font-mono px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 break-all select-all"
              >
                {studentUrl}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 px-5 py-3 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: copied ? '#16a34a' : '#9f7a43' }}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-3">
              Students will receive a unique 4-letter code when they visit this link.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Your teacher dashboard
            </p>
            <a
              href={`/teacher?classId=${createdClassId}`}
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:underline"
              style={{ color: '#9f7a43' }}
            >
              View Dashboard
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
            </a>
            <p className="text-sm text-gray-400 mt-1">
              Use the password you set to view student progress.
            </p>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => {
                setCreatedClassId(null);
                setSelectedPhilosopher(null);
                setSelectedTopic(null);
                setPassword('');
              }}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Create another class
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f8f8', fontFamily: 'system-ui, sans-serif' }}>
      <div className="max-w-[900px] mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create a Class</h1>
        <p className="text-gray-500 mb-10">
          Choose a philosopher and topic, then share the link with your students.
        </p>

        {/* Step 1: Philosopher */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            1. Choose a philosopher
          </label>
          <div className="grid grid-cols-2 gap-3">
            {PHILOSOPHERS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPhilosopher(p.id);
                  setSelectedTopic(null);
                }}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  selectedPhilosopher === p.id
                    ? 'border-[#9f7a43] bg-white shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{p.name}</div>
                <div className="text-sm text-gray-400 mt-0.5">{p.years}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Topic (shown after philosopher selected) */}
        {selectedPhilosopher && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              2. Choose a topic
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    selectedTopic === topic.id
                      ? 'border-[#9f7a43] bg-white shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{topic.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{topic.description}</div>
                  <div className="text-xs text-gray-400 mt-2">{topic.sourceText}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Password */}
        {selectedTopic && (
          <div className="mb-8">
            <label htmlFor="dashboard-password" className="block text-sm font-medium text-gray-700 mb-2">
              3. Set a dashboard password
            </label>
            <p className="text-sm text-gray-400 mb-3">
              You will use this to view student results. Keep it simple — this is not high-security.
            </p>
            <input
              id="dashboard-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="e.g. philosophy101"
              className="w-full max-w-sm px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 text-base focus:outline-none focus:border-[#9f7a43] focus:ring-1 focus:ring-[#9f7a43]"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Submit */}
        {selectedTopic && (
          <button
            onClick={handleCreate}
            disabled={!password.trim() || isCreating}
            className="px-6 py-3 rounded-lg text-white font-medium text-sm transition-opacity disabled:opacity-40"
            style={{ backgroundColor: '#9f7a43' }}
          >
            {isCreating ? 'Creating...' : 'Create Class'}
          </button>
        )}
      </div>
    </div>
  );
}
