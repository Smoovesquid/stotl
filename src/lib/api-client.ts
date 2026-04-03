// Multi-provider API client
// Supports: OpenRouter (all models), Ollama (local), Anthropic (direct), OpenAI (direct)

import { getConfig } from './config';
import { getPersona } from './personas';

// System prompt can be overridden per-call (e.g., learn mode phases)

export async function chat(
  messages: { role: string; content: string }[],
  isFirstSession: boolean,
  systemPromptOverride?: string
): Promise<string> {
  const config = getConfig();
  if (!config) throw new Error('Not configured');
  const persona = getPersona(config.personaId || 'aristotle');

  // Build the first message if this is a new session
  const chatMessages = messages.length === 0 && isFirstSession
    ? [{ role: 'user', content: '[A new person has connected. Speak first. Follow your system prompt instructions for greeting a new user.]' }]
    : messages;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  // If persona has a preferred model AND user is on OpenRouter, use that model
  const effectiveModel = (persona.preferredModel && config.brainProvider === 'openrouter')
    ? persona.preferredModel
    : config.openrouterModel;

  // If persona needs a specific model but user is on Anthropic (which won't work for villains),
  // force OpenRouter with the preferred model
  const forceOpenRouter = persona.preferredModel && (config.brainProvider === 'anthropic');

  try {
    let result: string;

    const sp = systemPromptOverride || persona.systemPrompt;

    switch (forceOpenRouter ? 'openrouter' : config.brainProvider) {
      case 'openrouter':
        result = await callOpenRouter(config.openrouterKey, effectiveModel, chatMessages, sp, controller.signal);
        break;
      case 'ollama':
        result = await callOllama(config.ollamaUrl, config.ollamaModel, chatMessages, sp, controller.signal);
        break;
      case 'anthropic':
        result = await callAnthropic(config.anthropicKey, chatMessages, sp, controller.signal);
        break;
      case 'openai':
        result = await callOpenAI(config.openaiKey, chatMessages, sp, controller.signal);
        break;
      default:
        throw new Error(`Unknown provider: ${config.brainProvider}`);
    }

    clearTimeout(timeout);
    return result;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// --- OpenRouter (one key, every model) ---
async function callOpenRouter(
  apiKey: string, model: string, messages: { role: string; content: string }[], systemPrompt: string, signal: AbortSignal
): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://stotl.app',
      'X-Title': 'Stotl',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`OpenRouter error ${response.status}: ${err.slice(0, 200)}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '...the signal falters.';
}

// --- Ollama (local, free, no key) ---
async function callOllama(
  baseUrl: string, model: string, messages: { role: string; content: string }[], systemPrompt: string, signal: AbortSignal
): Promise<string> {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
    signal,
  });

  if (!response.ok) throw new Error(`Ollama error ${response.status}`);
  const data = await response.json();
  return data.message?.content || '...the signal falters.';
}

// --- Anthropic Claude (direct) ---
async function callAnthropic(
  apiKey: string, messages: { role: string; content: string }[], systemPrompt: string, signal: AbortSignal
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
    signal,
  });

  if (!response.ok) throw new Error(`Claude error ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text || '...the signal falters.';
}

// --- OpenAI (direct) ---
async function callOpenAI(
  apiKey: string, messages: { role: string; content: string }[], systemPrompt: string, signal: AbortSignal
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
    signal,
  });

  if (!response.ok) throw new Error(`OpenAI error ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '...the signal falters.';
}

// --- Voice (ElevenLabs or null for browser TTS) ---
export async function speakTextElevenLabs(text: string): Promise<Blob | null> {
  const config = getConfig();
  if (!config || config.voiceProvider !== 'elevenlabs' || !config.elevenlabsKey || !config.elevenlabsVoiceId) {
    return null; // caller falls back to browser TTS
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenlabsVoiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': config.elevenlabsKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) return null;
  return response.blob();
}

// --- Speech-to-text (Whisper via Groq — free, or OpenAI) ---
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const config = getConfig();
  if (!config) throw new Error('Not configured');

  // Build a FormData with the audio file
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'whisper-large-v3');

  // Try Groq first (free Whisper), fall back to OpenAI
  const endpoints = [
    { url: 'https://api.groq.com/openai/v1/audio/transcriptions', key: config.openrouterKey },
    { url: 'https://api.openai.com/v1/audio/transcriptions', key: config.openaiKey || config.openrouterKey },
  ];

  for (const endpoint of endpoints) {
    if (!endpoint.key) continue;
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${endpoint.key}`,
        },
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        return data.text || '';
      }
    } catch {
      continue;
    }
  }

  throw new Error('Transcription failed — no working STT endpoint');
}
