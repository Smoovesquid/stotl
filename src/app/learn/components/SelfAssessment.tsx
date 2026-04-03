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
      style={{ backgroundColor: 'var(--bg-void)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      <div className="w-full text-center" style={{ maxWidth: '500px' }}>
        <p className="text-[16px] italic font-light mb-10 leading-relaxed" style={{ color: 'var(--text-mid)' }}>
          Before {philosopherName} examines you, rate your understanding:
        </p>

        <div className="grid grid-cols-5 gap-3 max-w-[420px] mx-auto">
          {RATINGS.map(({ score, label }) => (
            <button
              key={score}
              onClick={() => onRate(score)}
              className="flex flex-col items-center gap-2 px-2 py-4 rounded cursor-pointer transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold-dim)';
                e.currentTarget.style.backgroundColor = 'rgba(212,168,75,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
              }}
            >
              <span className="text-[20px] font-light" style={{ color: 'var(--gold)' }}>
                {score}
              </span>
              <span className="text-[10px] font-sans tracking-wide" style={{ color: 'var(--text-ghost)' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
