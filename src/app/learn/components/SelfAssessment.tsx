'use client';

interface SelfAssessmentProps {
  philosopherName: string;
  onRate: (score: number) => void;
}

const RATINGS = [
  { score: 1, label: 'Not at all' },
  { score: 2, label: 'A little' },
  { score: 3, label: 'Mostly' },
  { score: 4, label: 'Well' },
  { score: 5, label: 'Very well' },
];

export default function SelfAssessment({ philosopherName, onRate }: SelfAssessmentProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#f8f8f8', fontFamily: 'system-ui', fontSize: '13px' }}
    >
      <div className="w-full text-center" style={{ maxWidth: '500px' }}>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: '#4a3f2f' }}>
          Before {philosopherName} examines you, rate your understanding:
        </p>

        <div className="grid grid-cols-5 gap-2 max-w-[420px] mx-auto">
          {RATINGS.map(({ score, label }) => (
            <button
              key={score}
              onClick={() => onRate(score)}
              className="flex flex-col items-center gap-1 px-2 py-3 rounded-lg cursor-pointer transition-all"
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
              <span className="text-lg font-semibold" style={{ color: '#9f7a43' }}>
                {score}
              </span>
              <span className="text-xs" style={{ color: '#7a6f5f' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
