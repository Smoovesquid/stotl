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
    // Reset textarea height
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
    // Auto-grow textarea
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#f8f8f8', fontFamily: 'system-ui', fontSize: '13px' }}
    >
      {/* Header bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: '#f8f8f8', borderBottom: '1px solid #e0d8c8' }}
      >
        <span className="text-sm font-medium" style={{ color: '#4a3f2f' }}>
          {philosopherName}
        </span>
        <div className="flex items-center gap-3">
          {phase === 'examination' && (
            <span className="text-xs" style={{ color: '#7a6f5f' }}>
              Question {Math.min(examTurn, 5)} of 5
            </span>
          )}
          <span
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={
              phase === 'learning'
                ? { backgroundColor: '#e8f5e9', color: '#2e7d32' }
                : { backgroundColor: '#fff3e0', color: '#e65100' }
            }
          >
            {phase === 'learning' ? 'Learning' : 'Examination'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6" style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <div className="flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="rounded-lg px-4 py-3 whitespace-pre-wrap"
                style={{
                  maxWidth: '80%',
                  ...(msg.role === 'philosopher'
                    ? {
                        backgroundColor: '#f0ebe0',
                        border: '1px solid #e0d8c8',
                        color: '#4a3f2f',
                      }
                    : {
                        backgroundColor: '#e8eef4',
                        border: '1px solid #d0dce8',
                        color: '#2a3f55',
                      }),
                }}
              >
                <p className="text-xs font-medium mb-1" style={{ opacity: 0.6 }}>
                  {msg.role === 'philosopher' ? philosopherName : 'You'}
                </p>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex justify-start">
              <div
                className="rounded-lg px-4 py-3"
                style={{
                  backgroundColor: '#f0ebe0',
                  border: '1px solid #e0d8c8',
                  color: '#4a3f2f',
                }}
              >
                <p className="text-xs font-medium mb-1" style={{ opacity: 0.6 }}>
                  {philosopherName}
                </p>
                <span className="thinking-dots">Thinking</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div
        className="sticky bottom-0 px-4 py-3"
        style={{ backgroundColor: '#f8f8f8', borderTop: '1px solid #e0d8c8' }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {phase === 'learning' && (
            <div className="mb-2 text-right">
              <button
                onClick={onReadyForExam}
                disabled={isThinking}
                className="text-xs font-medium px-4 py-2 rounded-full cursor-pointer transition-opacity"
                style={{
                  backgroundColor: '#fff3e0',
                  color: '#9f7a43',
                  border: '1px solid #e0d8c8',
                  opacity: isThinking ? 0.4 : 1,
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
                  ? 'Ask a question or share your thoughts...'
                  : 'Answer the question...'
              }
              rows={1}
              disabled={isThinking}
              className="flex-1 resize-none rounded-lg px-4 py-3 outline-none"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e0d8c8',
                color: '#4a3f2f',
                fontSize: '13px',
                fontFamily: 'system-ui',
                opacity: isThinking ? 0.5 : 1,
              }}
            />
            <button
              onClick={handleSend}
              disabled={isThinking || !input.trim()}
              className="rounded-lg px-4 py-3 text-sm font-medium cursor-pointer transition-opacity"
              style={{
                backgroundColor: '#9f7a43',
                color: '#fff',
                opacity: isThinking || !input.trim() ? 0.4 : 1,
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .thinking-dots::after {
          content: '';
          animation: dots 1.5s steps(4, end) infinite;
        }
        @keyframes dots {
          0% { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
          100% { content: ''; }
        }
      `}</style>
    </div>
  );
}
