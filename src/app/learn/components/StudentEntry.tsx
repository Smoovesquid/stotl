'use client';

import { useState } from 'react';

interface StudentEntryProps {
  philosopherName: string;
  topic: string;
  studentCode: string | null;
  onNewStudent: () => void;
  onReturningStudent: (code: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function StudentEntry({
  philosopherName,
  topic,
  studentCode,
  onNewStudent,
  onReturningStudent,
  isLoading,
  error,
}: StudentEntryProps) {
  const [mode, setMode] = useState<'choose' | 'new' | 'returning'>(
    studentCode ? 'new' : 'choose'
  );
  const [codeInput, setCodeInput] = useState('');

  const handleSubmitCode = () => {
    const trimmed = codeInput.trim().toUpperCase();
    if (trimmed.length === 4) {
      onReturningStudent(trimmed);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#f8f8f8', fontFamily: 'system-ui', fontSize: '13px' }}
    >
      <div className="w-full" style={{ maxWidth: '460px' }}>
        <div className="text-center mb-8">
          <h1 className="text-lg font-semibold mb-1" style={{ color: '#4a3f2f' }}>
            Learn from {philosopherName}
          </h1>
          {topic && (
            <p className="text-xs" style={{ color: '#9f7a43', fontStyle: 'italic' }}>
              {topic}
            </p>
          )}
        </div>

        {/* New student: show generated code */}
        {mode === 'new' && studentCode && (
          <div
            className="rounded-lg p-6 mb-6 text-center"
            style={{ backgroundColor: '#faf8f4', border: '1px solid #e0d8c8' }}
          >
            <p className="text-xs mb-3" style={{ color: '#4a3f2f' }}>
              Your student code is
            </p>
            <div
              className="text-4xl font-bold tracking-widest py-4 mb-3"
              style={{
                fontFamily: 'monospace',
                color: '#9f7a43',
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '2px dashed #e0d8c8',
              }}
            >
              {studentCode}
            </div>
            <p className="text-xs mb-6" style={{ color: '#7a6f5f' }}>
              Write this down. You will need it to return to this session.
            </p>
            <button
              onClick={onNewStudent}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: '#9f7a43',
                color: '#fff',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? 'Starting...' : 'Begin'}
            </button>
          </div>
        )}

        {/* Returning student: code input */}
        {mode === 'returning' && (
          <div
            className="rounded-lg p-6 mb-6"
            style={{ backgroundColor: '#faf8f4', border: '1px solid #e0d8c8' }}
          >
            <p className="text-xs mb-4" style={{ color: '#4a3f2f' }}>
              Enter your student code to continue
            </p>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 4))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitCode()}
              placeholder="e.g. XK47"
              maxLength={4}
              className="w-full py-3 px-4 rounded-lg text-center text-2xl tracking-widest mb-4 outline-none"
              style={{
                fontFamily: 'monospace',
                backgroundColor: '#fff',
                border: '1px solid #e0d8c8',
                color: '#4a3f2f',
              }}
              autoFocus
            />
            {error && (
              <p className="text-xs mb-3 text-center" style={{ color: '#c0392b' }}>
                {error}
              </p>
            )}
            <button
              onClick={handleSubmitCode}
              disabled={isLoading || codeInput.trim().length !== 4}
              className="w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: '#9f7a43',
                color: '#fff',
                opacity: isLoading || codeInput.trim().length !== 4 ? 0.4 : 1,
              }}
            >
              {isLoading ? 'Looking up...' : 'Continue'}
            </button>
          </div>
        )}

        {/* Mode chooser */}
        {mode === 'choose' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setMode('new');
                onNewStudent();
              }}
              className="w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: '#9f7a43',
                color: '#fff',
              }}
            >
              I'm a new student
            </button>
            <button
              onClick={() => setMode('returning')}
              className="w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: '#fff',
                color: '#4a3f2f',
                border: '1px solid #e0d8c8',
              }}
            >
              I have a code
            </button>
          </div>
        )}

        {/* Toggle link */}
        {mode !== 'choose' && (
          <p className="text-center mt-4">
            <button
              onClick={() => {
                setMode(mode === 'new' ? 'returning' : 'choose');
                setCodeInput('');
              }}
              className="text-xs underline cursor-pointer"
              style={{ color: '#9f7a43' }}
            >
              {mode === 'new' ? 'I have a code already' : 'Back'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
