import { supabase } from './supabase';

// --- Types ---

export interface Class {
  id: string;
  philosopher_id: string;
  topic_id: string;
  teacher_password: string;
  created_at: string;
}

export interface StudentCode {
  id: string;
  class_id: string;
  code: string;
  student_name: string | null;
  created_at: string;
}

export interface LearnSession {
  id: string;
  class_id: string;
  student_code: string;
  topic_id: string;
  phase: string;
  teaching_turns: number;
  exam_turns: number;
  self_assessment_score: number | null;
  assessment_letter: string | null;
  verdict_badge: string | null;
  philosopher_rating: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface LearnMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  phase: string;
  created_at: string;
}

export interface SessionWithMessages extends LearnSession {
  messages: LearnMessage[];
}

export interface ClassSessionWithStudent extends LearnSession {
  student_name: string | null;
}

// --- Class operations ---

export async function createClass(
  philosopherId: string,
  topicId: string,
  teacherPassword: string
): Promise<Class> {
  const { data, error } = await supabase
    .from('classes')
    .insert({ philosopher_id: philosopherId, topic_id: topicId, teacher_password: teacherPassword })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getClass(classId: string): Promise<Class | null> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }
  return data;
}

export async function verifyTeacherPassword(classId: string, password: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('classes')
    .select('teacher_password')
    .eq('id', classId)
    .single();
  if (error) return false;
  return data.teacher_password === password;
}

// --- Student code operations ---

function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function generateStudentCode(classId: string): Promise<string> {
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    const code = generateRandomCode();
    const { error } = await supabase
      .from('student_codes')
      .insert({ class_id: classId, code });

    if (!error) return code;

    // If unique constraint violation, retry with a new code
    if (error.code === '23505') continue;

    throw error;
  }
  throw new Error('Failed to generate unique student code after max retries');
}

export async function getStudentByCode(classId: string, code: string): Promise<StudentCode | null> {
  const { data, error } = await supabase
    .from('student_codes')
    .select('*')
    .eq('class_id', classId)
    .eq('code', code.toUpperCase())
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// --- Learn session operations ---

export async function createLearnSession(
  classId: string,
  studentCode: string,
  topicId: string
): Promise<LearnSession> {
  const { data, error } = await supabase
    .from('learn_sessions')
    .insert({ class_id: classId, student_code: studentCode, topic_id: topicId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getActiveSession(
  classId: string,
  studentCode: string
): Promise<LearnSession | null> {
  const { data, error } = await supabase
    .from('learn_sessions')
    .select('*')
    .eq('class_id', classId)
    .eq('student_code', studentCode)
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function updateSessionPhase(sessionId: string, phase: string): Promise<void> {
  const { error } = await supabase
    .from('learn_sessions')
    .update({ phase })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function incrementTeachingTurns(sessionId: string): Promise<void> {
  // Supabase doesn't support atomic increment in the client library,
  // so we fetch then update. For production, consider an RPC function.
  const { data, error: fetchError } = await supabase
    .from('learn_sessions')
    .select('teaching_turns')
    .eq('id', sessionId)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('learn_sessions')
    .update({ teaching_turns: (data.teaching_turns || 0) + 1 })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function incrementExamTurns(sessionId: string): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from('learn_sessions')
    .select('exam_turns')
    .eq('id', sessionId)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('learn_sessions')
    .update({ exam_turns: (data.exam_turns || 0) + 1 })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function saveSelfAssessment(sessionId: string, score: number): Promise<void> {
  const { error } = await supabase
    .from('learn_sessions')
    .update({ self_assessment_score: score })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function saveAssessment(
  sessionId: string,
  letter: string,
  verdictBadge: string,
  philosopherRating: number
): Promise<void> {
  const { error } = await supabase
    .from('learn_sessions')
    .update({
      assessment_letter: letter,
      verdict_badge: verdictBadge,
      philosopher_rating: philosopherRating,
      phase: 'complete',
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
  if (error) throw error;
}

// --- Learn message operations ---

export async function addLearnMessage(
  sessionId: string,
  role: string,
  content: string,
  phase: string
): Promise<LearnMessage> {
  const { data, error } = await supabase
    .from('learn_messages')
    .insert({ session_id: sessionId, role, content, phase })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getLearnMessages(sessionId: string): Promise<LearnMessage[]> {
  const { data, error } = await supabase
    .from('learn_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// --- Composite queries ---

export async function getClassSessions(classId: string): Promise<ClassSessionWithStudent[]> {
  // Get all sessions for the class
  const { data: sessions, error: sessionsError } = await supabase
    .from('learn_sessions')
    .select('*')
    .eq('class_id', classId)
    .order('started_at', { ascending: false });
  if (sessionsError) throw sessionsError;
  if (!sessions || sessions.length === 0) return [];

  // Get all student codes for the class to map code -> name
  const { data: students, error: studentsError } = await supabase
    .from('student_codes')
    .select('code, student_name')
    .eq('class_id', classId);
  if (studentsError) throw studentsError;

  const nameMap = new Map<string, string | null>();
  for (const s of students || []) {
    nameMap.set(s.code, s.student_name);
  }

  return sessions.map((session) => ({
    ...session,
    student_name: nameMap.get(session.student_code) ?? null,
  }));
}

export async function getSessionWithMessages(sessionId: string): Promise<SessionWithMessages | null> {
  const { data: session, error: sessionError } = await supabase
    .from('learn_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  if (sessionError) {
    if (sessionError.code === 'PGRST116') return null;
    throw sessionError;
  }

  const messages = await getLearnMessages(sessionId);

  return { ...session, messages };
}
