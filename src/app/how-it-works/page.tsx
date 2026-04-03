'use client';

export default function HowItWorksPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#0d0b09', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      <div className="max-w-[600px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-[28px] italic font-light mb-3"
            style={{ color: 'var(--text-high)' }}
          >
            How Stotl Works
          </h1>
          <p className="text-[14px]" style={{ color: 'var(--text-ghost)' }}>
            Two ways to learn from history's greatest minds.
          </p>
        </div>

        {/* Mode 1: Free Conversation */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-sans font-semibold"
              style={{ backgroundColor: 'rgba(212,168,75,0.15)', color: 'var(--gold)' }}
            >
              1
            </div>
            <h2 className="text-[20px] italic" style={{ color: 'var(--text-high)' }}>
              Free Conversation
            </h2>
          </div>

          <p className="text-[15px] leading-[1.8] mb-4" style={{ color: 'var(--text-mid)' }}>
            Choose a philosopher. Make a pact about what you want to explore. Then talk.
          </p>

          <div className="space-y-4 ml-11">
            <Step number="a" title="Set up your brain">
              Choose an AI provider (OpenRouter, Claude, OpenAI, or local with Ollama).
              Optionally add an ElevenLabs key for voice.
            </Step>
            <Step number="b" title="Pick a philosopher">
              Aristotle, Plato, or others. Each speaks from their own time and convictions.
            </Step>
            <Step number="c" title="Choose your pact">
              What do you seek? Understanding your mind, living truthfully, thinking clearly...
              The philosopher holds you to this purpose across every session.
            </Step>
            <Step number="d" title="Converse">
              Type or speak. The philosopher responds in character, drawing from their
              actual works. Voice on or off. Swipe left to see your journey.
            </Step>
          </div>

          <div
            className="mt-6 p-4 rounded border"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}
          >
            <p className="text-[12px] font-sans" style={{ color: 'var(--text-ghost)' }}>
              Everything stays on your device. Your API keys, conversations, and pact are
              stored in your browser's local storage. Nothing is sent anywhere except to
              the AI provider you choose.
            </p>
          </div>
        </section>

        {/* Mode 2: Learn from the Source */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-sans font-semibold"
              style={{ backgroundColor: 'rgba(212,168,75,0.15)', color: 'var(--gold)' }}
            >
              2
            </div>
            <h2 className="text-[20px] italic" style={{ color: 'var(--text-high)' }}>
              Learn from the Source
            </h2>
          </div>

          <p className="text-[15px] leading-[1.8] mb-4" style={{ color: 'var(--text-mid)' }}>
            Structured lessons for classrooms. A teacher creates a class, students join
            with a link, and the philosopher teaches then examines them.
          </p>

          <div className="mb-6">
            <h3 className="text-[16px] italic mb-3" style={{ color: 'var(--gold-dim)' }}>
              For teachers
            </h3>
            <div className="space-y-4 ml-5">
              <Step number="1" title="Create a class">
                Pick a philosopher and topic (e.g. Aristotle on Virtue Ethics). Set a
                simple password for your dashboard.
              </Step>
              <Step number="2" title="Share the link">
                Students get a unique URL. When they visit, they receive a 4-letter code
                to identify themselves.
              </Step>
              <Step number="3" title="Watch the dashboard">
                See each student's progress, verdict (Understood / Promising / Partial / Not Yet),
                the philosopher's assessment letter, and the full transcript.
              </Step>
            </div>
          </div>

          <div>
            <h3 className="text-[16px] italic mb-3" style={{ color: 'var(--gold-dim)' }}>
              For students
            </h3>
            <div className="space-y-4 ml-5">
              <Step number="1" title="Open the link your teacher gave you">
                You'll get a 4-letter code. Write it down. You need it to come back.
              </Step>
              <Step number="2" title="Learn">
                The philosopher teaches you the topic through dialogue. Ask questions,
                share your thoughts, go as deep as you want.
              </Step>
              <Step number="3" title="Rate yourself">
                Before the exam, rate how well you think you understand the material
                (1 to 5).
              </Step>
              <Step number="4" title="Get examined">
                The philosopher asks you 5 questions to test your understanding.
                Answer honestly... they'll know.
              </Step>
              <Step number="5" title="Receive your assessment">
                A personalized letter from the philosopher, a verdict badge, and a
                metacognition score comparing your self-rating to theirs.
              </Step>
            </div>
          </div>
        </section>

        {/* What you need */}
        <section className="mb-12">
          <h2 className="text-[20px] italic mb-4" style={{ color: 'var(--text-high)' }}>
            What you need
          </h2>

          <div className="space-y-3">
            <Requirement label="For free conversation">
              An API key from OpenRouter, Anthropic, or OpenAI. Or run a local model
              with Ollama (free, no key needed).
            </Requirement>
            <Requirement label="For classroom mode">
              A Supabase database (the teacher sets this up) and an Anthropic API key
              for the server-side AI.
            </Requirement>
            <Requirement label="For voice (optional)">
              An ElevenLabs API key. Without it, Stotl falls back to your browser's
              built-in text-to-speech.
            </Requirement>
          </div>
        </section>

        {/* Navigation */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <a
            href="/"
            className="text-[14px] italic transition-colors hover:text-[var(--gold)]"
            style={{ color: 'var(--text-mid)' }}
          >
            Start a conversation
          </a>
          <a
            href="/learn"
            className="text-[14px] italic transition-colors hover:text-[var(--gold)]"
            style={{ color: 'var(--text-mid)' }}
          >
            Learn from the Source
          </a>
          <a
            href="/setup"
            className="text-[12px] font-sans transition-colors hover:text-[var(--gold)]"
            style={{ color: 'var(--text-ghost)' }}
          >
            Settings
          </a>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[12px] font-sans font-medium" style={{ color: 'var(--gold-dim)' }}>
          {number}.
        </span>
        <span className="text-[15px]" style={{ color: 'var(--text-high)' }}>
          {title}
        </span>
      </div>
      <p className="text-[14px] leading-[1.7] ml-5" style={{ color: 'var(--text-low)' }}>
        {children}
      </p>
    </div>
  );
}

function Requirement({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="p-4 rounded border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}
    >
      <p className="text-[12px] font-sans font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--gold-dim)' }}>
        {label}
      </p>
      <p className="text-[14px] leading-[1.6]" style={{ color: 'var(--text-mid)' }}>
        {children}
      </p>
    </div>
  );
}
