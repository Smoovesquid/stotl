'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getPersona } from '@/lib/personas';
import {
  generateStudentCode,
  getStudentByCode,
  createLearnSession,
  getActiveSession,
  getLearnMessages,
  addLearnMessage,
  updateSessionPhase,
  incrementTeachingTurns,
  incrementExamTurns,
  saveSelfAssessment,
  saveAssessment,
} from '@/lib/learn-db';

import StudentEntry from './components/StudentEntry';
import TopicSelector from './components/TopicSelector';
import LearnChat from './components/LearnChat';
import SafetyNetModal from './components/SafetyNetModal';
import SelfAssessment from './components/SelfAssessment';
import AssessmentReport from './components/AssessmentReport';

type Phase =
  | 'entry'
  | 'topic_select'
  | 'learning'
  | 'safety_net'
  | 'self_assessment'
  | 'examination'
  | 'report';

interface ChatMessage {
  role: 'philosopher' | 'student';
  content: string;
}

// Inner component that uses useSearchParams (needs Suspense boundary)
function LearnPageInner() {
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId') || '';
  const philosopherId = searchParams.get('philosopher') || 'aristotle';
  const urlTopic = searchParams.get('topic') || '';

  const persona = getPersona(philosopherId);

  // State machine
  const [phase, setPhase] = useState<Phase>('entry');
  const [studentCode, setStudentCode] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>(urlTopic);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [teachingTurns, setTeachingTurns] = useState(0);
  const [examTurns, setExamTurns] = useState(0);
  const [selfScore, setSelfScore] = useState<number | null>(null);
  const [assessmentLetter, setAssessmentLetter] = useState<string | null>(null);
  const [verdictBadge, setVerdictBadge] = useState<string | null>(null);
  const [philosopherRating, setPhilosopherRating] = useState<number | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [entryLoading, setEntryLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  // Load topics for this philosopher
  const [topics, setTopics] = useState<
    { id: string; title: string; description: string; sourceText: string }[]
  >([]);

  useEffect(() => {
    async function loadTopics() {
      // Dynamic import based on philosopher
      try {
        const mod = await import(`@/lib/personas/topics/${philosopherId}-topics`);
        const key = Object.keys(mod).find((k) => k.endsWith('_TOPICS'));
        if (key) {
          setTopics(
            mod[key].map((t: any) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              sourceText: t.sourceText,
            }))
          );
        }
      } catch {
        // No topics file for this philosopher
        setTopics([]);
      }
    }
    loadTopics();
  }, [philosopherId]);

  // Send a message to the chat API
  const sendChatMessage = useCallback(
    async (userMessage: string, currentPhase: 'learning' | 'examination') => {
      if (!sessionId) return;

      // Add student message to UI
      const studentMsg: ChatMessage = { role: 'student', content: userMessage };
      setMessages((prev) => [...prev, studentMsg]);
      setIsThinking(true);

      // Persist student message
      await addLearnMessage(sessionId, 'student', userMessage, currentPhase);

      try {
        const res = await fetch('/api/learn/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            classId,
            philosopherId,
            topicId: selectedTopic,
            phase: currentPhase,
            messages: [...messages, studentMsg].map((m) => ({
              role: m.role === 'philosopher' ? 'assistant' : 'user',
              content: m.content,
            })),
          }),
        });

        if (!res.ok) throw new Error('Chat API error');

        const data = await res.json();
        const text = data.response || data.content || '...the philosopher is lost in thought.';
        const philosopherMsg: ChatMessage = {
          role: 'philosopher',
          content: text,
        };

        setMessages((prev) => [...prev, philosopherMsg]);
        await addLearnMessage(sessionId, 'philosopher', text, currentPhase);

        // Track turns
        if (currentPhase === 'learning') {
          const newCount = teachingTurns + 1;
          setTeachingTurns(newCount);
          await incrementTeachingTurns(sessionId);
        } else {
          const newCount = examTurns + 1;
          setExamTurns(newCount);
          await incrementExamTurns(sessionId);

          // Hard limit at 5 exam turns — auto-trigger assessment
          if (newCount >= 5) {
            setPhase('report');
            setIsAssessing(true);
            await updateSessionPhase(sessionId, 'report');
            await runAssessment(sessionId);
          }
        }
      } catch (err) {
        console.error('Chat error:', err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'philosopher',
            content: 'The signal falters... Please try again.',
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [sessionId, classId, philosopherId, selectedTopic, messages, teachingTurns, examTurns]
  );

  // Run the assessment API
  const runAssessment = useCallback(
    async (sid: string) => {
      setIsAssessing(true);
      try {
        const res = await fetch('/api/learn/assess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sid,
            classId,
            philosopherId,
            topicId: selectedTopic,
            messages: messages.map((m) => ({
              role: m.role === 'philosopher' ? 'assistant' : 'user',
              content: m.content,
            })),
            selfAssessmentScore: selfScore,
          }),
        });

        if (!res.ok) throw new Error('Assessment API error');

        const data = await res.json();
        setAssessmentLetter(data.letter);
        setVerdictBadge(data.verdictBadge);
        setPhilosopherRating(data.philosopherRating);

        // Persist to DB
        await saveAssessment(sid, data.letter, data.verdictBadge, data.philosopherRating);
      } catch (err) {
        console.error('Assessment error:', err);
        setAssessmentLetter(
          'The assessment could not be completed at this time. Please speak with your teacher.'
        );
        setVerdictBadge('Partial');
        setPhilosopherRating(null);
      } finally {
        setIsAssessing(false);
      }
    },
    [classId, philosopherId, selectedTopic, messages, selfScore]
  );

  // --- Entry handlers ---

  const handleNewStudent = async () => {
    setEntryLoading(true);
    setEntryError(null);
    try {
      const code = await generateStudentCode(classId);
      setStudentCode(code);
      setGeneratedCode(code);
      // Don't advance phase yet — show the code first, wait for "Begin" click
    } catch (err) {
      console.error('Failed to generate code:', err);
      setEntryError('Could not generate a student code. Please try again.');
    } finally {
      setEntryLoading(false);
    }
  };

  const handleBeginAfterCode = async () => {
    if (!studentCode) return;
    setEntryLoading(true);
    try {
      await startSession(studentCode);
    } finally {
      setEntryLoading(false);
    }
  };

  const handleReturningStudent = async (code: string) => {
    setEntryLoading(true);
    setEntryError(null);
    try {
      const student = await getStudentByCode(classId, code);
      if (!student) {
        setEntryError('Code not found. Check your code and try again.');
        setEntryLoading(false);
        return;
      }
      setStudentCode(code);
      // Check for active session to resume
      const active = await getActiveSession(classId, code);
      if (active) {
        // Resume existing session
        setSessionId(active.id);
        setSelectedTopic(active.topic_id);
        setTeachingTurns(active.teaching_turns);
        setExamTurns(active.exam_turns);
        setSelfScore(active.self_assessment_score);

        // Load existing messages
        const existing = await getLearnMessages(active.id);
        setMessages(
          existing.map((m) => ({
            role: m.role === 'philosopher' ? 'philosopher' : 'student',
            content: m.content,
          })) as ChatMessage[]
        );

        // Resume at the right phase
        if (active.assessment_letter) {
          setAssessmentLetter(active.assessment_letter);
          setVerdictBadge(active.verdict_badge);
          setPhilosopherRating(active.philosopher_rating);
          setPhase('report');
        } else if (active.phase === 'examination') {
          setPhase('examination');
        } else {
          setPhase('learning');
        }
      } else {
        // No active session, start fresh
        await startSession(code);
      }
    } catch (err) {
      console.error('Returning student error:', err);
      setEntryError('Something went wrong. Please try again.');
    } finally {
      setEntryLoading(false);
    }
  };

  const startSession = async (code: string) => {
    if (urlTopic) {
      // Topic from URL — skip selection, create session directly
      const session = await createLearnSession(classId, code, urlTopic);
      setSessionId(session.id);
      setSelectedTopic(urlTopic);
      setPhase('learning');
      await updateSessionPhase(session.id, 'learning');
      // Get initial philosopher message
      await fetchInitialMessage(session.id, urlTopic);
    } else {
      // Need topic selection
      setPhase('topic_select');
    }
  };

  const handleTopicSelect = async (topicId: string) => {
    if (!studentCode) return;
    setSelectedTopic(topicId);
    setIsThinking(true);
    try {
      const session = await createLearnSession(classId, studentCode, topicId);
      setSessionId(session.id);
      setPhase('learning');
      await updateSessionPhase(session.id, 'learning');
      await fetchInitialMessage(session.id, topicId);
    } catch (err) {
      console.error('Session creation error:', err);
    } finally {
      setIsThinking(false);
    }
  };

  const fetchInitialMessage = async (sid: string, topicId: string) => {
    setIsThinking(true);
    try {
      const res = await fetch('/api/learn/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sid,
          classId,
          philosopherId,
          topicId,
          phase: 'learning',
          messages: [],
        }),
      });

      if (!res.ok) throw new Error('Chat API error');

      const data = await res.json();
      const msg: ChatMessage = { role: 'philosopher', content: data.content };
      setMessages([msg]);
      await addLearnMessage(sid, 'philosopher', data.content, 'learning');
      setTeachingTurns(1);
      await incrementTeachingTurns(sid);
    } catch (err) {
      console.error('Initial message error:', err);
    } finally {
      setIsThinking(false);
    }
  };

  // --- Phase transition handlers ---

  const handleReadyForExam = () => {
    if (teachingTurns < 4) {
      setPhase('safety_net');
    } else {
      setPhase('self_assessment');
    }
  };

  const handleSafetyNetContinue = () => {
    setPhase('learning');
  };

  const handleSafetyNetProceed = () => {
    setPhase('self_assessment');
  };

  const handleSelfAssessment = async (score: number) => {
    setSelfScore(score);
    if (sessionId) {
      await saveSelfAssessment(sessionId, score);
      await updateSessionPhase(sessionId, 'examination');
    }
    setPhase('examination');
    // Fetch first exam question
    if (sessionId) {
      setIsThinking(true);
      try {
        const res = await fetch('/api/learn/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            classId,
            philosopherId,
            topicId: selectedTopic,
            phase: 'examination',
            messages: [],
          }),
        });

        if (!res.ok) throw new Error('Chat API error');

        const data = await res.json();
        const msg: ChatMessage = { role: 'philosopher', content: data.content };
        // Keep learning messages but start exam section
        setMessages((prev) => [...prev, msg]);
        await addLearnMessage(sessionId, 'philosopher', data.content, 'examination');
        setExamTurns(1);
        await incrementExamTurns(sessionId);
      } catch (err) {
        console.error('First exam question error:', err);
      } finally {
        setIsThinking(false);
      }
    }
  };

  // --- Render ---

  if (phase === 'entry') {
    return (
      <StudentEntry
        philosopherName={persona.name}
        topic={topics.find((t) => t.id === urlTopic)?.title || ''}
        studentCode={generatedCode}
        onNewStudent={generatedCode ? handleBeginAfterCode : handleNewStudent}
        onReturningStudent={handleReturningStudent}
        isLoading={entryLoading}
        error={entryError}
      />
    );
  }

  if (phase === 'topic_select') {
    return (
      <TopicSelector
        topics={topics}
        philosopherName={persona.name}
        onSelect={handleTopicSelect}
      />
    );
  }

  if (phase === 'learning') {
    return (
      <LearnChat
        messages={messages}
        phase="learning"
        philosopherName={persona.name}
        isThinking={isThinking}
        examTurn={0}
        onSendMessage={(content) => sendChatMessage(content, 'learning')}
        onReadyForExam={handleReadyForExam}
      />
    );
  }

  if (phase === 'safety_net') {
    return (
      <>
        <LearnChat
          messages={messages}
          phase="learning"
          philosopherName={persona.name}
          isThinking={false}
          examTurn={0}
          onSendMessage={() => {}}
          onReadyForExam={() => {}}
        />
        <SafetyNetModal
          philosopherName={persona.name}
          teachingTurns={teachingTurns}
          onContinueLearning={handleSafetyNetContinue}
          onProceedAnyway={handleSafetyNetProceed}
        />
      </>
    );
  }

  if (phase === 'self_assessment') {
    return (
      <SelfAssessment
        philosopherName={persona.name}
        onRate={handleSelfAssessment}
      />
    );
  }

  if (phase === 'examination') {
    return (
      <LearnChat
        messages={messages}
        phase="examination"
        philosopherName={persona.name}
        isThinking={isThinking}
        examTurn={examTurns}
        onSendMessage={(content) => sendChatMessage(content, 'examination')}
        onReadyForExam={() => {}}
      />
    );
  }

  if (phase === 'report') {
    return (
      <AssessmentReport
        philosopherName={persona.name}
        letter={assessmentLetter}
        verdictBadge={verdictBadge}
        selfScore={selfScore}
        philosopherRating={philosopherRating}
        isLoading={isAssessing}
      />
    );
  }

  return null;
}

// Wrap in Suspense for useSearchParams
export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: '#f8f8f8', fontFamily: 'system-ui', fontSize: '13px', color: '#7a6f5f' }}
        >
          Loading...
        </div>
      }
    >
      <LearnPageInner />
    </Suspense>
  );
}
