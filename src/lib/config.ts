// User configuration — stored in localStorage
// The buyer provides their own API keys. No server-side keys needed.

export type BrainProvider = 'openrouter' | 'ollama' | 'anthropic' | 'openai';
export type VoiceProvider = 'browser' | 'elevenlabs';

export interface StotlConfig {
  // Persona
  personaId: string;
  // Brain
  brainProvider: BrainProvider;
  openrouterKey: string;
  openrouterModel: string;
  ollamaModel: string;
  ollamaUrl: string;        // default: http://localhost:11434
  anthropicKey: string;
  openaiKey: string;
  // Voice
  voiceProvider: VoiceProvider;
  elevenlabsKey: string;
  elevenlabsVoiceId: string;
}

export const DEFAULT_CONFIG: StotlConfig = {
  personaId: 'aristotle',
  brainProvider: 'openrouter',
  openrouterKey: '',
  openrouterModel: 'deepseek/deepseek-chat-v3-0324',
  ollamaModel: 'llama3.1',
  ollamaUrl: 'http://localhost:11434',
  anthropicKey: '',
  openaiKey: '',
  voiceProvider: 'browser',
  elevenlabsKey: '',
  elevenlabsVoiceId: '',
};

// Popular models on OpenRouter (shown in setup dropdown)
export const OPENROUTER_MODELS = [
  { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3', price: 'Very cheap (~$0.001/response)', tier: 'free' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', price: 'Cheap (~$0.003/response)', tier: 'free' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', price: 'Cheap (~$0.002/response)', tier: 'cheap' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', price: 'Premium (~$0.02/response)', tier: 'premium' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', price: 'Premium (~$0.02/response)', tier: 'premium' },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', price: 'Best quality (~$0.10/response)', tier: 'premium' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', price: 'Nearly free', tier: 'free' },
  { id: 'mistralai/mistral-large-2411', name: 'Mistral Large', price: 'Moderate (~$0.01/response)', tier: 'cheap' },
];

const STORAGE_KEY = 'stotl-config';

export function getConfig(): StotlConfig | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch {
    return null;
  }
}

export function saveConfig(config: StotlConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function isConfigured(): boolean {
  const config = getConfig();
  if (!config) return false;
  switch (config.brainProvider) {
    case 'openrouter': return !!config.openrouterKey;
    case 'ollama': return true; // no key needed
    case 'anthropic': return !!config.anthropicKey;
    case 'openai': return !!config.openaiKey;
    default: return false;
  }
}

export function clearConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}
