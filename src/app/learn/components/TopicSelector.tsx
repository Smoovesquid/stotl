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
      style={{ backgroundColor: '#f8f8f8', fontFamily: 'system-ui', fontSize: '13px' }}
    >
      <div className="w-full" style={{ maxWidth: '600px' }}>
        <div className="text-center mb-8">
          <h1 className="text-lg font-semibold mb-1" style={{ color: '#4a3f2f' }}>
            Choose a topic
          </h1>
          <p className="text-xs" style={{ color: '#7a6f5f' }}>
            What would you like {philosopherName} to teach you?
          </p>
        </div>

        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onSelect(topic.id)}
              className="text-left rounded-lg p-5 transition-all cursor-pointer group"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e0d8c8',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#9f7a43';
                e.currentTarget.style.backgroundColor = '#faf8f4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e0d8c8';
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              <h3
                className="font-bold mb-1"
                style={{ fontSize: '14px', color: '#4a3f2f' }}
              >
                {topic.title}
              </h3>
              <p
                className="mb-2 leading-relaxed"
                style={{ fontSize: '12px', color: '#5a5045' }}
              >
                {topic.description}
              </p>
              <p
                style={{
                  fontSize: '11px',
                  color: '#9f7a43',
                  fontStyle: 'italic',
                }}
              >
                {topic.sourceText}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
