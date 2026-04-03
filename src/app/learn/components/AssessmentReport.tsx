'use client';

interface AssessmentReportProps {
  philosopherName: string;
  letter: string | null;
  verdictBadge: string | null;
  selfScore: number | null;
  philosopherRating: number | null;
  isLoading: boolean;
}

const VERDICT_STYLES: Record<string, { bg: string; color: string }> = {
  Understood: { bg: '#e8f5e9', color: '#2e7d32' },
  Promising: { bg: '#e3f2fd', color: '#1565c0' },
  Partial: { bg: '#fff3e0', color: '#e65100' },
  'Not Yet': { bg: '#ffebee', color: '#c62828' },
};

const SCORE_LABELS: Record<number, string> = {
  1: 'Not at all',
  2: 'A little',
  3: 'Mostly',
  4: 'Well',
  5: 'Very well',
};

export default function AssessmentReport({
  philosopherName,
  letter,
  verdictBadge,
  selfScore,
  philosopherRating,
  isLoading,
}: AssessmentReportProps) {
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: '#f8f8f8', fontFamily: 'system-ui', fontSize: '13px' }}
      >
        <div className="text-center">
          <p className="text-sm mb-3" style={{ color: '#4a3f2f' }}>
            {philosopherName} is writing your assessment...
          </p>
          <div className="assessment-loading-bar mx-auto" />
        </div>

        <style jsx>{`
          .assessment-loading-bar {
            width: 120px;
            height: 2px;
            background: #e0d8c8;
            border-radius: 2px;
            overflow: hidden;
            position: relative;
          }
          .assessment-loading-bar::after {
            content: '';
            position: absolute;
            top: 0;
            left: -40px;
            width: 40px;
            height: 100%;
            background: #9f7a43;
            border-radius: 2px;
            animation: loading-slide 1.2s ease-in-out infinite;
          }
          @keyframes loading-slide {
            0% { left: -40px; }
            100% { left: 120px; }
          }
        `}</style>
      </div>
    );
  }

  const verdictStyle = VERDICT_STYLES[verdictBadge || ''] || VERDICT_STYLES['Partial'];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#f8f8f8', fontFamily: 'system-ui', fontSize: '13px' }}
    >
      <div className="w-full" style={{ maxWidth: '600px' }}>
        {/* Verdict badge */}
        {verdictBadge && (
          <div className="text-center mb-6">
            <span
              className="inline-block text-sm font-semibold px-5 py-2 rounded-full"
              style={{ backgroundColor: verdictStyle.bg, color: verdictStyle.color }}
            >
              {verdictBadge}
            </span>
          </div>
        )}

        {/* Assessment letter card */}
        <div
          className="rounded-xl p-8 mb-6"
          style={{
            backgroundColor: '#faf8f4',
            border: '1px solid #e0d8c8',
          }}
        >
          <div
            className="whitespace-pre-wrap leading-relaxed"
            style={{ color: '#4a3f2f', fontSize: '15px', lineHeight: '1.6' }}
          >
            {letter}
          </div>

          {/* Philosopher signature */}
          <div className="mt-8 text-right">
            <p
              className="font-medium"
              style={{ color: '#9f7a43', fontStyle: 'italic', fontSize: '14px' }}
            >
              -- {philosopherName}
            </p>
          </div>
        </div>

        {/* Metacognition gap */}
        {selfScore != null && philosopherRating != null && (
          <div
            className="rounded-lg p-5 mb-6"
            style={{
              backgroundColor: '#fff',
              border: '1px solid #e0d8c8',
            }}
          >
            <p className="text-xs font-medium mb-3" style={{ color: '#7a6f5f' }}>
              Metacognition
            </p>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs" style={{ color: '#7a6f5f' }}>You rated yourself</p>
                <p className="text-sm font-semibold" style={{ color: '#2a3f55' }}>
                  {selfScore}/5 ({SCORE_LABELS[selfScore] || ''})
                </p>
              </div>
              <div
                className="text-center px-3"
                style={{ color: '#e0d8c8', fontSize: '20px' }}
              >
                vs
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: '#7a6f5f' }}>
                  {philosopherName} rated you
                </p>
                <p className="text-sm font-semibold" style={{ color: '#9f7a43' }}>
                  {philosopherRating}/5
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Teacher note */}
        <p className="text-center text-xs" style={{ color: '#7a6f5f' }}>
          Your teacher will see this assessment.
        </p>
      </div>
    </div>
  );
}
