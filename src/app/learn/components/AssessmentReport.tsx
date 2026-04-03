'use client';

interface AssessmentReportProps {
  philosopherName: string;
  letter: string | null;
  verdictBadge: string | null;
  selfScore: number | null;
  philosopherRating: number | null;
  isLoading: boolean;
}

const VERDICT_STYLES: Record<string, { border: string; color: string }> = {
  Understood: { border: 'rgba(46,125,50,0.4)', color: '#81c784' },
  Promising: { border: 'rgba(21,101,192,0.4)', color: '#64b5f6' },
  Partial: { border: 'rgba(212,168,75,0.4)', color: 'var(--gold)' },
  'Not Yet': { border: 'rgba(198,40,40,0.4)', color: '#ef9a9a' },
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
        style={{ backgroundColor: 'var(--bg-void)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        <div className="text-center">
          <p className="text-[16px] italic font-light mb-4" style={{ color: 'var(--text-mid)' }}>
            {philosopherName} is writing your assessment...
          </p>
          <div className="reaching-text text-[10px] tracking-[3px] uppercase font-sans" style={{ color: 'var(--text-ghost)' }}>
            Reaching...
          </div>
        </div>
      </div>
    );
  }

  const verdictStyle = VERDICT_STYLES[verdictBadge || ''] || VERDICT_STYLES['Partial'];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--bg-void)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      <div className="w-full" style={{ maxWidth: '600px' }}>
        {/* Verdict badge */}
        {verdictBadge && (
          <div className="text-center mb-8">
            <span
              className="inline-block text-[12px] tracking-[2px] uppercase font-sans px-5 py-2 rounded-full"
              style={{ border: `1px solid ${verdictStyle.border}`, color: verdictStyle.color }}
            >
              {verdictBadge}
            </span>
          </div>
        )}

        {/* Assessment letter */}
        <div
          className="rounded p-8 mb-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="whitespace-pre-wrap italic font-light leading-[1.8]"
            style={{ color: 'var(--text-high)', fontSize: '17px' }}
          >
            {letter}
          </div>

          {/* Philosopher signature */}
          <div className="mt-8 text-right">
            <p
              className="italic font-light"
              style={{ color: 'var(--gold-dim)', fontSize: '16px' }}
            >
              — {philosopherName}
            </p>
          </div>
        </div>

        {/* Metacognition gap */}
        {selfScore != null && philosopherRating != null && (
          <div
            className="rounded p-6 mb-6"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-[10px] tracking-[2px] uppercase font-sans mb-4" style={{ color: 'var(--text-ghost)' }}>
              Metacognition
            </p>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[11px] font-sans" style={{ color: 'var(--text-ghost)' }}>You rated yourself</p>
                <p className="text-[16px] italic font-light" style={{ color: 'var(--text-high)' }}>
                  {selfScore}/5 <span className="text-[13px]" style={{ color: 'var(--text-low)' }}>({SCORE_LABELS[selfScore] || ''})</span>
                </p>
              </div>
              <div
                className="text-center px-4 text-[16px] italic"
                style={{ color: 'var(--text-void)' }}
              >
                vs
              </div>
              <div className="text-right">
                <p className="text-[11px] font-sans" style={{ color: 'var(--text-ghost)' }}>
                  {philosopherName} rated you
                </p>
                <p className="text-[16px] italic font-light" style={{ color: 'var(--gold)' }}>
                  {philosopherRating}/5
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Teacher note */}
        <p className="text-center text-[11px] font-sans" style={{ color: 'var(--text-ghost)' }}>
          Your teacher will see this assessment.
        </p>
      </div>
    </div>
  );
}
