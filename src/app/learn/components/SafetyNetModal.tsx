'use client';

interface SafetyNetModalProps {
  philosopherName: string;
  teachingTurns: number;
  onContinueLearning: () => void;
  onProceedAnyway: () => void;
}

export default function SafetyNetModal({
  philosopherName,
  teachingTurns,
  onContinueLearning,
  onProceedAnyway,
}: SafetyNetModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div
        className="rounded p-8 w-full"
        style={{
          maxWidth: '420px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          fontFamily: "'Cormorant Garamond', Georgia, serif",
        }}
      >
        <p className="text-[15px] italic font-light leading-relaxed mb-8" style={{ color: 'var(--text-mid)' }}>
          You've only heard{' '}
          <span className="font-semibold" style={{ color: 'var(--gold)' }}>
            {teachingTurns}
          </span>{' '}
          of {philosopherName}'s opening thoughts.
          <br />
          <br />
          Are you sure you're ready for examination?
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onContinueLearning}
            className="w-full py-3 px-4 rounded text-[12px] tracking-[2px] uppercase font-sans cursor-pointer transition-all"
            style={{
              backgroundColor: 'rgba(212,168,75,0.12)',
              color: 'var(--gold)',
              border: '1px solid var(--gold)',
            }}
          >
            I need more time
          </button>
          <button
            onClick={onProceedAnyway}
            className="w-full py-3 px-4 rounded text-[12px] tracking-[2px] uppercase font-sans cursor-pointer transition-all"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-ghost)',
              border: '1px solid var(--border)',
            }}
          >
            I'm ready anyway
          </button>
        </div>
      </div>
    </div>
  );
}
