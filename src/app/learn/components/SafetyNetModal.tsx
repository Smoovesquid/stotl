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
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
    >
      <div
        className="rounded-xl p-8 w-full shadow-lg"
        style={{
          maxWidth: '420px',
          backgroundColor: '#faf8f4',
          border: '1px solid #e0d8c8',
          fontFamily: 'system-ui',
          fontSize: '13px',
        }}
      >
        <p className="text-sm leading-relaxed mb-6" style={{ color: '#4a3f2f' }}>
          You've only heard{' '}
          <span className="font-semibold" style={{ color: '#9f7a43' }}>
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
            className="w-full py-3 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors"
            style={{
              backgroundColor: '#9f7a43',
              color: '#fff',
            }}
          >
            I need more time
          </button>
          <button
            onClick={onProceedAnyway}
            className="w-full py-3 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors"
            style={{
              backgroundColor: '#fff',
              color: '#4a3f2f',
              border: '1px solid #e0d8c8',
            }}
          >
            I'm ready anyway
          </button>
        </div>
      </div>
    </div>
  );
}
