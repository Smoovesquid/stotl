import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// Backwards compat: lazy getter
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Database types matching our schema
export interface Session {
  id: string;
  user_id: string;
  started_at: string;
  summary_json: SessionSummaryJson | null;
  turn_count: number;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'aristotle';
  content: string;
  created_at: string;
}

export interface SessionSummaryJson {
  topics: string[];
  user_positions: string[];
  aristotle_challenges: string[];
  growth_notes: string;
  session_number: number;
}

// --- Session operations ---

export async function createSession(userId: string): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_id: userId, turn_count: 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSessionHistory(userId: string, limit = 20): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getRecentSummaries(userId: string, limit = 3): Promise<SessionSummaryJson[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('summary_json')
    .eq('user_id', userId)
    .not('summary_json', 'is', null)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(d => d.summary_json).filter(Boolean);
}

// --- Message operations ---

export async function storeMessage(
  sessionId: string,
  role: 'user' | 'aristotle',
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ session_id: sessionId, role, content })
    .select()
    .single();
  if (error) throw error;

  // Increment turn count
  await supabase.rpc('increment_turn_count', { sid: sessionId });

  return data;
}

export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// For sessions 1-3: get full transcript instead of summaries
export async function getFullTranscript(userId: string): Promise<string> {
  const sessions = await getSessionHistory(userId, 3);
  if (sessions.length === 0) return '';

  let transcript = '\n\n## Prior Conversations (full transcript)\n\n';
  for (const session of sessions.reverse()) {
    const messages = await getSessionMessages(session.id);
    transcript += `--- Session (${new Date(session.started_at).toLocaleDateString()}) ---\n`;
    for (const msg of messages) {
      transcript += `${msg.role === 'user' ? 'You' : 'Aristotle'}: ${msg.content}\n`;
    }
    transcript += '\n';
  }
  return transcript;
}

export async function updateSessionSummary(
  sessionId: string,
  summary: SessionSummaryJson
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ summary_json: summary })
    .eq('id', sessionId);
  if (error) throw error;
}
