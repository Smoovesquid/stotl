'use client';

import { useEffect, useState, useRef } from 'react';

// Glitch text — renders with corruption that resolves
export function GlitchText({ text, className = '' }: { text: string; className?: string }) {
  const [displayText, setDisplayText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(true);

  useEffect(() => {
    if (!text) return;
    setIsGlitching(true);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZαβγδεζηθικλμνξοπρστυφχψω';
    const originalChars = text.split('');
    const resolved = new Array(text.length).fill(false);
    let frame = 0;

    const interval = setInterval(() => {
      frame++;
      const result = originalChars.map((char, i) => {
        if (resolved[i] || char === ' ') return char;
        // Resolve characters progressively over 500ms (~30 frames at 60fps)
        if (frame > (i / text.length) * 30) {
          resolved[i] = true;
          return char;
        }
        return chars[Math.floor(Math.random() * chars.length)];
      });
      setDisplayText(result.join(''));

      if (resolved.every(Boolean)) {
        clearInterval(interval);
        setIsGlitching(false);
        setDisplayText(text);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className={`${className} ${isGlitching ? 'glitch-active' : ''}`}>
      {displayText}
    </span>
  );
}

// Connection quality indicator — wavering gold line
export function ConnectionIndicator({ status }: { status: 'reaching' | 'connected' | 'lost' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      <div className={`connection-dot ${status}`} />
      <div className={`connection-dot ${status}`} style={{ animationDelay: '0.5s' }} />
      <div className={`connection-dot ${status}`} style={{ animationDelay: '1s' }} />
      <span className="text-[9px] tracking-[3px] uppercase font-sans"
        style={{ color: status === 'lost' ? '#8a4228' : '#6b5a32' }}>
        {status === 'reaching' ? 'Reaching...' :
          status === 'connected' ? 'Signal Holding' :
            'Signal Lost'}
      </span>
    </div>
  );
}

// Reaching ritual — the connection animation
export function ReachingScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete(), 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ backgroundColor: '#111111' }}>
      <span className="text-[13px] tracking-[6px] font-sans"
        style={{ color: '#a08050' }}>384 BC</span>
      <div className="signal-line my-8" />
      <span className="text-[15px] tracking-[8px] uppercase reaching-text"
        style={{ color: '#d4a84b' }}>Reaching...</span>
      <div className="signal-line my-8" />
      <span className="text-[13px] tracking-[6px] font-sans"
        style={{ color: '#a08050' }}>2026 AD</span>
      <span className="text-[11px] tracking-[3px] font-sans mt-12"
        style={{ color: '#908060' }}>2,410 years</span>
    </div>
  );
}

// Signal lost overlay
export function SignalLostOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-40 signal-lost-overlay"
      style={{ backgroundColor: 'rgba(13, 11, 9, 0.95)' }}>
      <span className="text-[13px] tracking-[6px] uppercase font-sans"
        style={{ color: '#4a3e2a' }}>Signal Lost...</span>
      <div className="signal-line my-6" />
      <span className="text-[10px] tracking-[3px] font-sans"
        style={{ color: '#1a1714' }}>384 BC</span>
    </div>
  );
}

// Waveform with intentional stutter
export function Waveform({ active }: { active: boolean }) {
  const bars = [6, 16, 10, 24, 4, 20, 12, 26, 8, 18];

  return (
    <div className="flex items-center justify-center gap-[2px] h-8">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-[2px] rounded-sm transition-all duration-300 ${active ? 'waveform-bar' : ''
            }`}
          style={{
            height: active ? `${height}px` : '2px',
            backgroundColor: '#c4a265',
            opacity: active ? (i === 4 ? 0.2 : 0.5) : 0.1, // bar 5 is the "dropout"
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// Scanlines overlay (subtle CRT effect)
export function Scanlines() {
  return <div className="scanlines pointer-events-none fixed inset-0 z-30" />;
}
