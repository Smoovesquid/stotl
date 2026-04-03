'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'philosopher' | 'student';
  content: string;
}

interface LearnChatProps {
  messages: Message[];
  phase: 'learning' | 'examination';
  philosopherName: string;
  isThinking: boolean;
  examTurn: number;
  onSendMessage: (content: string) => void;
  onReadyForExam: () => void;
}

export default function LearnChat({
  messages,
  phase,
  philosopherName,
  isThinking,
  examTurn,
  onSendMessage,
  onReadyForExam,
}: LearnChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isThinking) return;
    onSendMessage(trimmed);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-void)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      {/* Header bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: 'var(--bg-void)', borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-[14px] italic font-light" style={{ color: 'var(--text-high)' }}>
          {philosopherName}
        </span>
        <div className="flex items-center gap-3">
          {phase === 'examination' && (
            <span className="text-[11px] font-sans tracking-wide" style={{ color: 'var(--text-ghost)' }}>
              Question {Math.min(examTurn, 5)} of 5
            </span>
          )}
          <span
            className="text-[10px] tracking-[2px] uppercase font-sans px-3 py-1 rounded-full"
            style={
              phase === 'learning'
                ? { backgroundColor: 'rgba(212,168,75,0.1)', color: 'var(--gold-dim)' }
                : { backgroundColor: 'rgba(196,80,40,0.15)', color: '#e8a87c' }
            }
          >
            {phase === 'learning' ? 'Learning' : 'Examination'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
        <div className="flex flex-col gap-6">
          {messages.map((msg, i) => (
            <div key={i} className={`${msg.role === 'student' ? 'text-right' : ''}`}>
              <div className="text-[9px] tracking-[2px] uppercase mb-1.5 font-sans"
                style={{ color: msg.role === 'philosopher' ? 'var(--gold-dim)' : 'var(--text-ghost)' }}>
                {msg.role === 'philosopher' ? philosopherName : 'You'}
              </div>
              <div
                className={`text-[17px] leading-[1.7] ${msg.role === 'philosopher' ? 'italic font-light' : ''}`}
                style={{
                  color: msg.role === 'philosopher' ? 'var(--text-high)' : 'var(--text-mid)',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div>
              <div className="text-[9px] tracking-[2px] uppercase mb-1.5 font-sans"
                style={{ color: 'var(--gold-dim)' }}>
                {philosopherName}
              </div>
              <span className="text-[15px] italic" style={{ color: 'var(--text-ghost)' }}>
                <span className="reaching-text">Reaching...</span>
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div
        className="sticky bottom-0 px-6 py-4"
        style={{ backgroundColor: 'var(--bg-void)', borderTop: '1px solid var(--border)' }}
      >
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {phase === 'learning' && (
            <div className="mb-3 text-right">
              <button
                onClick={onReadyForExam}
                disabled={isThinking}
                className="text-[10px] tracking-[2px] uppercase font-sans px-4 py-2 rounded-full cursor-pointer transition-all"
                style={{
                  backgroundColor: 'rgba(212,168,75,0.08)',
                  color: 'var(--gold-dim)',
                  border: '1px solid var(--border)',
                  opacity: isThinking ? 0.3 : 1,
                }}
              >
                I'm ready to be examined
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={
                phase === 'learning'
                  ? `Speak to ${philosopherName}...`
                  : 'Answer the question...'
              }
              rows={1}
              disabled={isThinking}
              className="flex-1 resize-none rounded px-4 py-3 text-[16px] italic focus:outline-none focus:border-[var(--gold-dim)]"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-high)',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                opacity: isThinking ? 0.3 : 1,
              }}
            />
            <button
              onClick={handleSend}
              disabled={isThinking || !input.trim()}
              className="px-5 py-3 text-[12px] tracking-[2px] uppercase font-sans rounded border disabled:opacity-20 transition-opacity"
              style={{ borderColor: 'var(--gold)', color: 'var(--gold)', backgroundColor: 'rgba(212,168,75,0.12)' }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
