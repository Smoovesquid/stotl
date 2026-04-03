'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ReachingScreen, ConnectionIndicator, GlitchText, Waveform, Scanlines, SignalLostOverlay } from '@/components/portal-ui';
import { MicButton } from '@/components/mic-button';
import { startAmbientHum, stopAmbientHum, setAmbientLevel, resumeAudio } from '@/lib/audio';
import { getConfig, isConfigured, saveConfig } from '@/lib/config';
import { chat, speakTextElevenLabs } from '@/lib/api-client';
import { PERSONA_LIST, getPersona, type Persona } from '@/lib/personas';

interface Message {
  role: 'user' | 'aristotle';
  content: string;
  isNew?: boolean;
}

export default function Home() {
  const router = useRouter();
  const [phase, setPhase] = useState<'reaching' | 'persona' | 'pact' | 'conversation'>('reaching');
  const [pact, setPact] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'reaching' | 'connected' | 'lost'>('reaching');
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(true);
  const [turnCount, setTurnCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false);
  const [showDictationTip, setShowDictationTip] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Redirect to setup if not configured
  useEffect(() => {
    if (!isConfigured()) {
      router.push('/setup');
    }
  }, [router]);

  // Detect speech recognition support (Chrome yes, Safari/WKWebView no)
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const hasIt = !!SR;
    setHasSpeechRecognition(hasIt);
    // Show dictation tip on Mac when no speech recognition (Tauri app)
    if (!hasIt && navigator.platform?.includes('Mac') && !localStorage.getItem('stotl-dictation-tip-dismissed')) {
      setShowDictationTip(true);
    }
  }, []);

  // Load saved pact on mount + preload voices
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem('stotl-pact');
    if (saved) setPact(saved);

    // Voices load async in Chrome — need to listen for the event
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Speak Aristotle's words aloud
  // Audio element for ElevenLabs playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakText = useCallback((text: string) => {
    if (!voiceEnabled) return;

    setIsSpeaking(true);

    // Try ElevenLabs first, fall back to browser TTS
    speakTextElevenLabs(text)
      .then(blob => {
        if (!blob) throw new Error('No voice configured');
        return blob;
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.pause();
          URL.revokeObjectURL(audioRef.current.src);
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audio.play().catch(() => setIsSpeaking(false));
      })
      .catch(() => {
        // Fallback to browser TTS if ElevenLabs fails
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.85;
          utterance.pitch = 0.9;
          const available = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
          const preferred = available.find(v => v.name.includes('Daniel')) || available.find(v => v.lang.startsWith('en'));
          if (preferred) utterance.voice = preferred;
          utterance.onend = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setIsSpeaking(false);
        }
      });
  }, [voiceEnabled, voices]);

  // Push-to-talk speech recognition
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) sendMessage(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // Start the conversation with Aristotle (called after pact is set)
  const startConversation = useCallback((chosenPact: string, isReturning: boolean) => {
    setPhase('conversation');
    setConnectionStatus('connected');
    setIsThinking(true);

    try { resumeAudio().then(() => { startAmbientHum(); setAmbientLevel('connected'); }).catch(() => {}); } catch {}

    // Tell the persona about the pact
    const currentPersona = getPersona(getConfig()?.personaId || 'aristotle');
    const pactContext = isReturning
      ? `[Returning. Their pact with you: "${chosenPact}". Reference it naturally. Open with a provocative continuation of your ongoing work together.]`
      : currentPersona.openingContext.replace('${pact}', chosenPact);

    chat([{ role: 'user', content: pactContext }], !isReturning)
      .then(text => {
        setMessages([{ role: 'aristotle', content: text, isNew: true }]);
        setIsThinking(false);
        speakText(text);
      })
      .catch((err) => {
        // If API fails, redirect to setup so user can fix their keys
        setIsThinking(false);
        router.push('/setup');
      });
  }, [speakText, router]);

  // Reaching ritual complete — show pact screen or conversation
  const handleReachingComplete = useCallback(() => {
    const savedPact = localStorage.getItem('stotl-pact');
    // Load saved persona
    const config = getConfig();
    const savedPersonaId = config?.personaId || localStorage.getItem('stotl-persona');
    if (savedPersonaId) {
      const p = getPersona(savedPersonaId);
      setPersona(p);
    }

    if (!savedPact || !savedPersonaId) {
      setPhase('persona');
      return;
    }
    setPact(savedPact);
    setPersona(getPersona(savedPersonaId));
    startConversation(savedPact, true);
  }, [startConversation]);

  // User selects persona
  const handlePersonaSelected = useCallback((p: Persona) => {
    setPersona(p);
    // Always save personaId — even if full config doesn't exist yet
    const config = getConfig();
    if (config) {
      saveConfig({ ...config, personaId: p.id });
    } else {
      // Create minimal config with just the persona
      const { DEFAULT_CONFIG } = require('@/lib/config');
      saveConfig({ ...DEFAULT_CONFIG, personaId: p.id });
    }
    localStorage.setItem('stotl-persona', p.id);
    setPhase('pact');
  }, []);

  // User selects their pact
  const handlePactSelected = useCallback((chosenPact: string) => {
    setPact(chosenPact);
    localStorage.setItem('stotl-pact', chosenPact);
    startConversation(chosenPact, false);
  }, [startConversation]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isThinking) return;

    const userMsg: Message = { role: 'user', content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsThinking(true);
    setAmbientLevel('reaching');

    try {
      const claudeMessages = updated.map(m => ({ role: m.role === 'aristotle' ? 'assistant' : 'user', content: m.content }));
      const response = await chat(claudeMessages, false);

      const newMessages = [...updated, { role: 'aristotle' as const, content: response, isNew: true }];
      setMessages(newMessages);
      setAmbientLevel('connected');
      speakText(response);

      // Incremental summarization every 5 user turns (fire-and-forget)
      const newTurnCount = turnCount + 1;
      setTurnCount(newTurnCount);
      if (newTurnCount % 5 === 0) {
        fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            sessionNumber: Math.ceil(newTurnCount / 5),
          }),
        }).then(r => r.json()).then(data => {
          // Store summary in localStorage for now (Supabase later)
          const summaries = JSON.parse(localStorage.getItem('stotl-summaries') || '[]');
          summaries.push({ ...data.summary, timestamp: new Date().toISOString() });
          localStorage.setItem('stotl-summaries', JSON.stringify(summaries));
        }).catch(() => { /* fire-and-forget */ });
      }

      // Persist messages to localStorage
      localStorage.setItem('stotl-messages', JSON.stringify(newMessages.map(m => ({ role: m.role, content: m.content }))));
    } catch {
      // First failure shows a message, second redirects to setup
      const failures = parseInt(localStorage.getItem('stotl-failures') || '0') + 1;
      localStorage.setItem('stotl-failures', String(failures));
      if (failures >= 2) {
        localStorage.setItem('stotl-failures', '0');
        router.push('/setup');
      } else {
        setConnectionStatus('lost');
        setAmbientLevel('lost');
        setTimeout(() => { setConnectionStatus('connected'); setAmbientLevel('connected'); }, 5000);
        setMessages(prev => [...prev, {
          role: 'aristotle',
          content: '...the signal falters. Speak again, friend.',
          isNew: true,
        }]);
      }
    }
    setIsThinking(false);
    setTextInput('');
  }, [messages, isThinking, turnCount, speakText]);

  // Handle audio recording (fallback to text for now)
  const handleRecordingComplete = useCallback(async (_blob: Blob) => {
    setShowTextInput(true);
  }, []);

  // Swipe left to navigate to Journey
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -80) router.push('/journey'); // swipe left
  }, [router]);

  // Reaching phase
  if (phase === 'reaching') {
    return <ReachingScreen onComplete={handleReachingComplete} />;
  }

  // Persona selection phase
  if (phase === 'persona') {
    return <PersonaScreen onSelect={handlePersonaSelected} />;
  }

  // Pact selection phase
  if (phase === 'pact') {
    return <PactScreen onSelect={handlePactSelected} persona={persona} />;
  }

  // Conversation phase
  return (
    <div className="h-screen flex flex-col max-w-[500px] mx-auto relative"
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
      style={{ backgroundColor: '#0d0b09' }}>
      <Scanlines />
      <SignalLostOverlay visible={connectionStatus === 'lost'} />

      {/* Connection indicator + persona/pact */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <ConnectionIndicator status={connectionStatus} />
        <div className="flex items-center justify-center gap-3 pb-2 px-4">
          <button
            onClick={() => {
              localStorage.removeItem('stotl-pact');
              localStorage.removeItem('stotl-persona');
              setMessages([]);
              setPhase('persona');
            }}
            className="text-[10px] tracking-[1px] uppercase font-sans px-2 py-0.5 rounded border transition-colors hover:border-[var(--gold-dim)]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-ghost)' }}
          >
            Switch
          </button>
          {pact && (
            <span className="text-[10px] italic font-sans" style={{ color: 'var(--text-ghost)' }}>
              {persona?.name || 'Aristotle'} · {pact.length > 35 ? pact.slice(0, 35) + '...' : pact}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-5">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-6 message-appear ${msg.role === 'user' ? 'text-right' : ''}`}>
            {msg.role === 'aristotle' && (
              <div className="text-[9px] tracking-[2px] uppercase mb-1.5"
                style={{ color: 'var(--gold-dim)' }}>
                {persona?.name || 'Aristotle'}
              </div>
            )}
            <div className={`text-[17px] leading-[1.7] ${msg.role === 'aristotle' ? 'italic font-light' : ''}`}
              style={{
                color: msg.role === 'aristotle' ? 'var(--text-high)' : 'var(--text-mid)',
              }}>
              {msg.role === 'aristotle' && msg.isNew ? (
                <GlitchText text={msg.content} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="mb-6">
            <div className="text-[9px] tracking-[2px] uppercase mb-1.5"
              style={{ color: 'var(--gold-dim)' }}>
              Aristotle
            </div>
            <Waveform active={true} />
            <div className="text-center mt-2">
              <span className="text-[9px] tracking-[3px] uppercase font-sans reaching-text"
                style={{ color: 'var(--text-ghost)' }}>
                Reaching...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom controls */}
      <div className="pb-10 pt-4 px-6">
        {/* Voice toggle */}
        <div className="flex justify-center mb-3">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="text-[10px] tracking-[2px] uppercase font-sans px-3 py-1 rounded border transition-all"
            style={{
              borderColor: voiceEnabled ? 'var(--gold)' : 'var(--border)',
              color: voiceEnabled ? 'var(--gold)' : 'var(--text-ghost)',
              backgroundColor: voiceEnabled ? 'rgba(212,168,75,0.08)' : 'transparent',
            }}
          >
            {voiceEnabled ? 'Voice On' : 'Voice Off'}
          </button>
        </div>

        {/* Dictation tip (macOS, shown once) */}
        {showDictationTip && (
          <div className="mb-3 p-3 border rounded relative" style={{ borderColor: 'var(--gold-dim)', backgroundColor: 'rgba(212,168,75,0.05)' }}>
            <button
              onClick={() => { setShowDictationTip(false); localStorage.setItem('stotl-dictation-tip-dismissed', '1'); }}
              className="absolute top-2 right-2 text-[12px] font-sans" style={{ color: 'var(--text-ghost)' }}
            >
              dismiss
            </button>
            <div className="text-[12px] font-sans leading-relaxed" style={{ color: 'var(--text-mid)' }}>
              <span style={{ color: 'var(--gold)' }}>Voice tip:</span> Click the text box, then press <strong style={{ color: 'var(--text-high)' }}>Fn</strong> twice to dictate with your voice.
              If it doesn't work, enable it: <strong style={{ color: 'var(--text-high)' }}>System Settings → Keyboard → Dictation → On</strong>
            </div>
          </div>
        )}

        {/* Text input + mic + send */}
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(textInput); }}
          className="flex gap-2 mb-3">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={`Speak to ${persona?.name || 'them'}...`}
            disabled={isThinking}
            className="flex-1 border rounded px-4 py-3 text-[16px] italic focus:outline-none disabled:opacity-30"
            style={{
              borderColor: 'var(--gold-dim)',
              color: 'var(--text-high)',
              backgroundColor: 'var(--bg-surface)',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
            }}
          />
          {hasSpeechRecognition && (
            <button
              type="button"
              onPointerDown={startListening}
              onPointerUp={stopListening}
              onPointerLeave={stopListening}
              disabled={isThinking || isSpeaking}
              className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 transition-all touch-none
                ${isListening ? 'border-[var(--gold)] bg-[rgba(212,168,75,0.15)] scale-110' : 'border-[var(--border)]'}
                disabled:opacity-20`}
              aria-label="Hold to speak"
            >
              <svg width="16" height="22" viewBox="0 0 16 22" fill="none" stroke={isListening ? 'var(--gold)' : 'var(--gold-dim)'} strokeWidth="1.5">
                <rect x="4" y="1" width="8" height="13" rx="4" />
                <path d="M1 10a7 7 0 0014 0" />
                <line x1="8" y1="17" x2="8" y2="21" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            disabled={!textInput.trim() || isThinking}
            className="px-5 py-3 text-[12px] tracking-[2px] uppercase font-sans rounded border disabled:opacity-50 transition-opacity"
            style={{ borderColor: 'var(--gold)', color: 'var(--gold)', backgroundColor: 'rgba(212,168,75,0.12)' }}
          >
            Send
          </button>
        </form>

        {/* Status hint */}
        <div className="text-center text-[9px] tracking-[1px] font-sans" style={{ color: 'var(--text-ghost)' }}>
          {isListening ? 'Listening... release to send' :
           isSpeaking ? 'Aristotle is speaking...' :
           !hasSpeechRecognition ? 'Click the input, press Fn twice to dictate' :
           voiceEnabled ? 'Hold mic to speak, or type' : 'Type or turn on voice'}
        </div>

        {/* Swipe hint */}
        <div className="flex justify-center gap-1.5 pt-3">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--gold)', opacity: 0.6 }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--text-void)' }} />
        </div>
      </div>
    </div>
  );
}

// The Pact — what do you seek from Aristotle?
const PACT_OPTIONS = [
  {
    title: 'Understand my own mind',
    description: 'Consciousness, self-knowledge, the examined life. Know thyself.',
  },
  {
    title: 'Live more truthfully',
    description: 'Ethics, virtue, courage. How to act rightly in a complicated world.',
  },
  {
    title: 'Think more clearly',
    description: 'Logic, reasoning, argument. Sharpen how I process the world.',
  },
  {
    title: 'Find meaning and purpose',
    description: 'Eudaimonia, the good life, what makes a life worth living.',
  },
  {
    title: 'Understand others',
    description: 'Friendship, politics, persuasion. How humans work together and fail to.',
  },
];

// Persona selection screen
function PersonaScreen({ onSelect }: { onSelect: (persona: Persona) => void }) {
  return (
    <div className="h-screen flex flex-col max-w-[500px] mx-auto"
      style={{ backgroundColor: '#111111' }}>
      <Scanlines />
      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-12">
        <div className="text-center mb-10">
          <div className="signal-line mx-auto mb-6" />
          <h1 className="text-[20px] italic font-light leading-relaxed" style={{ color: 'var(--text-high)' }}>
            "Who do you wish to speak with?"
          </h1>
          <p className="text-[12px] font-sans mt-3" style={{ color: 'var(--text-ghost)' }}>
            Each mind speaks from their own time, their own convictions.
            <br />You decide what to believe.
          </p>
        </div>
        <div className="space-y-3">
          {PERSONA_LIST.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full text-left p-4 border rounded transition-all hover:border-[var(--gold-dim)]"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}
            >
              <div className="flex justify-between items-baseline">
                <span className="text-[16px]" style={{ color: 'var(--text-high)' }}>{p.name}</span>
                <span className="text-[11px] font-sans" style={{ color: 'var(--text-ghost)' }}>{p.years}</span>
              </div>
              <div className="text-[13px] italic mt-1" style={{ color: 'var(--text-low)' }}>
                {p.description}
              </div>
            </button>
          ))}
        </div>

        {/* Learn from the Source */}
        <div className="mt-10 mx-auto" style={{ maxWidth: '400px' }}>
          <div className="border rounded p-4 transition-all hover:border-[var(--gold-dim)]"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}>
            <a href="/learn" className="block">
              <div className="text-[11px] tracking-[2px] uppercase font-sans mb-2" style={{ color: 'var(--gold-dim)' }}>
                For classrooms
              </div>
              <div className="text-[16px]" style={{ color: 'var(--text-high)' }}>
                Learn from the Source
              </div>
              <div className="text-[13px] italic mt-1" style={{ color: 'var(--text-low)' }}>
                Structured lessons with Socratic examination. Teachers create classes, students get assessed.
              </div>
            </a>
          </div>
        </div>

        {/* Footer links */}
        <div className="flex justify-center gap-6 mt-8">
          <a
            href="/how-it-works"
            className="text-[11px] tracking-[1px] font-sans transition-colors hover:text-[var(--gold)]"
            style={{ color: 'var(--text-ghost)' }}
          >
            How it works
          </a>
          <a
            href="/setup"
            className="text-[11px] tracking-[1px] font-sans transition-colors hover:text-[var(--gold)]"
            style={{ color: 'var(--text-ghost)' }}
          >
            Settings
          </a>
        </div>
      </div>
    </div>
  );
}

function PactScreen({ onSelect, persona: personaProp }: { onSelect: (pact: string) => void; persona: Persona | null }) {
  // Read persona from config as backup (React state may not have updated yet)
  const persona = personaProp || getPersona(getConfig()?.personaId || localStorage.getItem('stotl-persona') || 'aristotle');
  const [customPact, setCustomPact] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="h-screen flex flex-col max-w-[500px] mx-auto"
      style={{ backgroundColor: '#111111' }}>
      <Scanlines />

      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="signal-line mx-auto mb-6" />
          <h1 className="text-[20px] italic font-light leading-relaxed" style={{ color: 'var(--text-high)' }}>
            "Before we begin... tell me what you seek."
          </h1>
          <p className="text-[12px] font-sans mt-3" style={{ color: 'var(--text-ghost)' }}>
            {persona.name} will hold you to your purpose across every session.
            <br />You can change it anytime.
          </p>
        </div>

        {/* Options */}
        {!showCustom ? (
          <div className="space-y-3">
            {[...(persona?.pactOptions || PACT_OPTIONS), { title: 'Something else', description: 'Tell them in your own words.' }].map((option, i) => (
              <button
                key={i}
                onClick={() => {
                  if (option.title === 'Something else') {
                    setShowCustom(true);
                  } else {
                    onSelect(option.title + ' — ' + option.description);
                  }
                }}
                className="w-full text-left p-4 border rounded transition-all hover:border-[var(--gold-dim)]"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}
              >
                <div className="text-[16px]" style={{ color: 'var(--text-high)' }}>
                  {option.title}
                </div>
                <div className="text-[13px] italic mt-1" style={{ color: 'var(--text-low)' }}>
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-[14px] italic mb-4" style={{ color: 'var(--text-mid)' }}>
              Tell {persona.name} what you seek, in your own words.
            </p>
            <textarea
              value={customPact}
              onChange={(e) => setCustomPact(e.target.value)}
              placeholder="I want to..."
              rows={4}
              className="w-full border rounded p-4 text-[16px] italic focus:outline-none focus:border-[var(--gold-dim)] resize-none"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-high)',
                backgroundColor: 'var(--bg-surface)',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
              }}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowCustom(false)}
                className="px-4 py-2 text-[11px] tracking-[2px] uppercase font-sans rounded border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-ghost)' }}
              >
                Back
              </button>
              <button
                onClick={() => customPact.trim() && onSelect(customPact.trim())}
                disabled={!customPact.trim()}
                className="flex-1 px-4 py-2 text-[12px] tracking-[2px] uppercase font-sans rounded border disabled:opacity-20"
                style={{ borderColor: 'var(--gold)', color: 'var(--gold)', backgroundColor: 'rgba(212,168,75,0.08)' }}
              >
                Begin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
