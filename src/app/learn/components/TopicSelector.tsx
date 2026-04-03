'use client';

interface Topic {
  id: string;
  title: string;
  description: string;
  sourceText: string;
}

interface TopicSelectorProps {
  topics: Topic[];
  philosopherName: string;
  onSelect: (topicId: string) => void;
}

export default function TopicSelector({ topics, philosopherName, onSelect }: TopicSelectorProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--bg-void)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      <div className="w-full" style={{ maxWidth: '600px' }}>
        <div className="text-center mb-10">
          <h1 className="text-[20px] italic font-light mb-2" style={{ color: 'var(--text-high)' }}>
            "What shall we study?"
          </h1>
          <p className="text-[12px] font-sans" style={{ color: 'var(--text-ghost)' }}>
            Choose what {philosopherName} will teach you.
          </p>
        </div>

        <div className="space-y-3">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onSelect(topic.id)}
              className="w-full text-left p-5 rounded border transition-all cursor-pointer hover:border-[var(--gold-dim)]"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="text-[16px] mb-1" style={{ color: 'var(--text-high)' }}>
                {topic.title}
              </div>
              <div className="text-[14px] italic font-light mb-2" style={{ color: 'var(--text-low)' }}>
                {topic.description}
              </div>
              <div className="text-[11px] font-sans" style={{ color: 'var(--gold-dim)' }}>
                {topic.sourceText}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
