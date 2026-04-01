'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig, saveConfig, DEFAULT_CONFIG, OPENROUTER_MODELS, type StotlConfig, type BrainProvider, type VoiceProvider } from '@/lib/config';
import { chatWithAristotle } from '@/lib/api-client';
import { Scanlines } from '@/components/portal-ui';

export default function SetupPage() {
  const router = useRouter();
  const [config, setConfig] = useState<StotlConfig>(DEFAULT_CONFIG);
  const [step, setStep] = useState<'brain' | 'voice' | 'testing' | 'done'>('brain');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const saved = getConfig();
    if (saved) setConfig(saved);
  }, []);

  const update = (partial: Partial<StotlConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  };

  const testBrain = async () => {
    setTesting(true);
    setTestResult(null);
    // Temporarily save config so api-client can read it
    saveConfig(config);
    try {
      const response = await chatWithAristotle(
        [{ role: 'user', content: 'Say "the signal holds" in exactly four words.' }],
        false
      );
      setTestResult(`Connected. Aristotle says: "${response.slice(0, 100)}"`);
      setStep('voice');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setTestResult(`Failed: ${msg}`);
    }
    setTesting(false);
  };

  const finish = (voiceProvider: VoiceProvider) => {
    const final = { ...config, voiceProvider };
    saveConfig(final);
    setStep('done');
    setTimeout(() => router.push('/'), 1500);
  };

  const inputStyle = {
    borderColor: 'var(--border)',
    color: 'var(--text-high)',
    backgroundColor: 'var(--bg-surface)',
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-6 pt-16 pb-10 max-w-[500px] mx-auto"
      style={{ backgroundColor: '#111111' }}>
      <Scanlines />

      {/* Header */}
      <div className="text-center mb-8 w-full">
        <h1 className="text-[22px] italic font-light" style={{ color: 'var(--text-high)' }}>
          Stotl
        </h1>
        <div className="signal-line mx-auto my-4" />
        <p className="text-[13px]" style={{ color: 'var(--text-mid)' }}>
          {step === 'brain' ? 'Choose Aristotle\'s brain.' :
           step === 'voice' ? 'Choose Aristotle\'s voice.' :
           step === 'testing' ? 'Testing connection...' :
           'The portal is ready.'}
        </p>
      </div>

      {/* Step 1: Brain */}
      {step === 'brain' && (
        <div className="w-full space-y-4">

          {/* Provider selection */}
          <div className="space-y-2">
            {([
              { id: 'openrouter' as BrainProvider, name: 'OpenRouter', desc: 'One key, every model. Free and paid options.', needsKey: true },
              { id: 'ollama' as BrainProvider, name: 'Local (Ollama)', desc: 'Free forever. Runs on your computer. No account.', needsKey: false },
              { id: 'anthropic' as BrainProvider, name: 'Claude (Direct)', desc: 'Anthropic API key. Best quality.', needsKey: true },
              { id: 'openai' as BrainProvider, name: 'OpenAI (Direct)', desc: 'OpenAI API key. GPT-4o.', needsKey: true },
            ]).map(provider => (
              <button
                key={provider.id}
                onClick={() => update({ brainProvider: provider.id })}
                className="w-full text-left p-3 border rounded transition-all"
                style={{
                  borderColor: config.brainProvider === provider.id ? 'var(--gold)' : 'var(--border)',
                  backgroundColor: config.brainProvider === provider.id ? 'rgba(212,168,75,0.06)' : 'var(--bg-surface)',
                }}
              >
                <div className="text-[14px]" style={{ color: config.brainProvider === provider.id ? 'var(--gold)' : 'var(--text-high)' }}>
                  {provider.name}
                </div>
                <div className="text-[11px] font-sans mt-0.5" style={{ color: 'var(--text-ghost)' }}>
                  {provider.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Provider-specific fields */}
          {config.brainProvider === 'openrouter' && (
            <div className="space-y-3 mt-4">
              <div>
                <label className="text-[10px] tracking-[2px] uppercase font-sans block mb-1.5"
                  style={{ color: 'var(--gold-dim)' }}>OpenRouter API Key</label>
                <input
                  type="password"
                  value={config.openrouterKey}
                  onChange={(e) => update({ openrouterKey: e.target.value })}
                  placeholder="sk-or-..."
                  className="w-full border rounded px-4 py-3 text-[14px] font-sans focus:outline-none focus:border-[var(--gold-dim)]"
                  style={inputStyle}
                />
                <p className="text-[10px] font-sans mt-1" style={{ color: 'var(--text-ghost)' }}>
                  Free at <a href="https://openrouter.ai/keys" target="_blank" style={{ color: 'var(--gold-dim)', textDecoration: 'underline' }}>openrouter.ai/keys</a>
                </p>
              </div>
              <div>
                <label className="text-[10px] tracking-[2px] uppercase font-sans block mb-1.5"
                  style={{ color: 'var(--gold-dim)' }}>Model</label>
                <select
                  value={config.openrouterModel}
                  onChange={(e) => update({ openrouterModel: e.target.value })}
                  className="w-full border rounded px-4 py-3 text-[14px] font-sans focus:outline-none"
                  style={inputStyle}
                >
                  {OPENROUTER_MODELS.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.price}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {config.brainProvider === 'ollama' && (
            <div className="space-y-3 mt-4">
              <div>
                <label className="text-[10px] tracking-[2px] uppercase font-sans block mb-1.5"
                  style={{ color: 'var(--gold-dim)' }}>Ollama URL</label>
                <input
                  type="text"
                  value={config.ollamaUrl}
                  onChange={(e) => update({ ollamaUrl: e.target.value })}
                  className="w-full border rounded px-4 py-3 text-[14px] font-sans focus:outline-none focus:border-[var(--gold-dim)]"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[2px] uppercase font-sans block mb-1.5"
                  style={{ color: 'var(--gold-dim)' }}>Model</label>
                <input
                  type="text"
                  value={config.ollamaModel}
                  onChange={(e) => update({ ollamaModel: e.target.value })}
                  placeholder="llama3.1"
                  className="w-full border rounded px-4 py-3 text-[14px] font-sans focus:outline-none focus:border-[var(--gold-dim)]"
                  style={inputStyle}
                />
                <p className="text-[10px] font-sans mt-1" style={{ color: 'var(--text-ghost)' }}>
                  Install: <a href="https://ollama.com" target="_blank" style={{ color: 'var(--gold-dim)', textDecoration: 'underline' }}>ollama.com</a> then run: <code style={{ color: 'var(--gold-ghost)' }}>ollama pull llama3.1</code>
                </p>
              </div>
            </div>
          )}

          {config.brainProvider === 'anthropic' && (
            <div className="mt-4">
              <label className="text-[10px] tracking-[2px] uppercase font-sans block mb-1.5"
                style={{ color: 'var(--gold-dim)' }}>Claude API Key</label>
              <input
                type="password"
                value={config.anthropicKey}
                onChange={(e) => update({ anthropicKey: e.target.value })}
                placeholder="sk-ant-..."
                className="w-full border rounded px-4 py-3 text-[14px] font-sans focus:outline-none focus:border-[var(--gold-dim)]"
                style={inputStyle}
              />
              <p className="text-[10px] font-sans mt-1" style={{ color: 'var(--text-ghost)' }}>
                Get at <a href="https://console.anthropic.com/settings/keys" target="_blank" style={{ color: 'var(--gold-dim)', textDecoration: 'underline' }}>console.anthropic.com</a>
              </p>
            </div>
          )}

          {config.brainProvider === 'openai' && (
            <div className="mt-4">
              <label className="text-[10px] tracking-[2px] uppercase font-sans block mb-1.5"
                style={{ color: 'var(--gold-dim)' }}>OpenAI API Key</label>
              <input
                type="password"
                value={config.openaiKey}
                onChange={(e) => update({ openaiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full border rounded px-4 py-3 text-[14px] font-sans focus:outline-none focus:border-[var(--gold-dim)]"
                style={inputStyle}
              />
              <p className="text-[10px] font-sans mt-1" style={{ color: 'var(--text-ghost)' }}>
                Get at <a href="https://platform.openai.com/api-keys" target="_blank" style={{ color: 'var(--gold-dim)', textDecoration: 'underline' }}>platform.openai.com</a>
              </p>
            </div>
          )}

          {testResult && (
            <p className="text-[12px] font-sans" style={{ color: testResult.startsWith('Connected') ? '#4ade80' : '#ef4444' }}>
              {testResult}
            </p>
          )}

          <button
            onClick={testBrain}
            disabled={testing || (config.brainProvider !== 'ollama' && !config.openrouterKey && !config.anthropicKey && !config.openaiKey)}
            className="w-full py-3 text-[12px] tracking-[2px] uppercase font-sans rounded border disabled:opacity-30 mt-4"
            style={{ borderColor: 'var(--gold)', color: 'var(--gold)', backgroundColor: 'rgba(212,168,75,0.08)' }}
          >
            {testing ? 'Testing connection...' : 'Connect'}
          </button>

          {/* Return to conversation if already configured */}
          {getConfig() && (
            <button onClick={() => router.push('/')}
              className="w-full mt-3 text-center text-[11px] font-sans" style={{ color: 'var(--text-ghost)' }}>
              Already configured. Return to Aristotle.
            </button>
          )}
        </div>
      )}

      {/* Step 2: Voice */}
      {step === 'voice' && (
        <div className="w-full space-y-3">
          <button
            onClick={() => finish('browser')}
            className="w-full text-left p-4 border rounded transition-all hover:border-[var(--gold-dim)]"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="text-[15px]" style={{ color: 'var(--text-high)' }}>Built-in Voice (Free)</div>
            <div className="text-[12px] font-sans mt-1" style={{ color: 'var(--text-ghost)' }}>
              Uses your computer's text-to-speech. Good enough to start.
            </div>
          </button>

          <button
            onClick={() => update({ voiceProvider: 'elevenlabs' as VoiceProvider })}
            className="w-full text-left p-4 border rounded transition-all hover:border-[var(--gold-dim)]"
            style={{
              borderColor: config.voiceProvider === 'elevenlabs' ? 'var(--gold)' : 'var(--border)',
              backgroundColor: config.voiceProvider === 'elevenlabs' ? 'rgba(212,168,75,0.06)' : 'var(--bg-surface)',
            }}
          >
            <div className="text-[15px]" style={{ color: 'var(--text-high)' }}>ElevenLabs (Custom AI Voice)</div>
            <div className="text-[12px] font-sans mt-1" style={{ color: 'var(--text-ghost)' }}>
              Create a unique voice for Aristotle. ~$5/month.
            </div>
          </button>

          {config.voiceProvider === 'elevenlabs' && (
            <div className="space-y-3 mt-2">
              <input
                type="password"
                value={config.elevenlabsKey}
                onChange={(e) => update({ elevenlabsKey: e.target.value })}
                placeholder="ElevenLabs API Key (sk_...)"
                className="w-full border rounded px-4 py-3 text-[14px] font-sans focus:outline-none focus:border-[var(--gold-dim)]"
                style={inputStyle}
              />
              <input
                type="text"
                value={config.elevenlabsVoiceId}
                onChange={(e) => update({ elevenlabsVoiceId: e.target.value })}
                placeholder="Voice ID"
                className="w-full border rounded px-4 py-3 text-[14px] font-sans focus:outline-none focus:border-[var(--gold-dim)]"
                style={inputStyle}
              />
              <button
                onClick={() => finish('elevenlabs')}
                disabled={!config.elevenlabsKey || !config.elevenlabsVoiceId}
                className="w-full py-3 text-[12px] tracking-[2px] uppercase font-sans rounded border disabled:opacity-30"
                style={{ borderColor: 'var(--gold)', color: 'var(--gold)', backgroundColor: 'rgba(212,168,75,0.08)' }}
              >
                Save & Enter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Done */}
      {step === 'done' && (
        <div className="text-center mt-8">
          <div className="signal-line mx-auto my-6" />
          <p className="text-[15px] italic" style={{ color: 'var(--gold)' }}>
            The portal is ready. Entering...
          </p>
        </div>
      )}
    </div>
  );
}
