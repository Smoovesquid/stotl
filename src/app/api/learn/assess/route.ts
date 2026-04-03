import { NextRequest, NextResponse } from 'next/server';

const ASSESSMENT_SYSTEM_PROMPT = `You are an assessment engine for a philosophy learning platform. You will receive a transcript of a Socratic examination between a philosopher and a student, along with metadata about the philosopher and topic.

Your job: write the philosopher's assessment letter AND produce a structured verdict.

INSTRUCTIONS:
1. Write as the philosopher, in their voice and style, signed with their name.
2. Reference specific things the student said — quote from the transcript.
3. Identify what the student understood well and what they missed or got wrong.
4. Suggest a next topic for continued study.
5. The letter should be 150-250 words.

VERDICT BADGES (pick exactly one):
- "Understood" — student demonstrated strong grasp of the core ideas, can apply them to new examples
- "Promising" — student is on the right track, grasps the basics but needs deeper engagement
- "Partial" — mixed results, some understanding but significant gaps or confusions
- "Not Yet" — student did not demonstrate understanding, may be reciting without comprehension

PHILOSOPHER RATING: rate 1-5 (the philosopher's assessment of the student's understanding)
- 5: Exceptional, could teach others
- 4: Strong grasp, minor gaps
- 3: Adequate, understands basics
- 2: Weak, significant misconceptions
- 1: Did not demonstrate understanding

GOLD STANDARD EXAMPLES:

Strong assessment (would be "Understood", rating 4):
"This student grasps the core distinction between comedy and tragedy — imitation of worse vs. better — and can apply it to unfamiliar examples. When I asked about the sitcom father, she correctly identified the gap between self-image and reality as the comic mechanism, which shows genuine understanding, not memorization. Where she struggles: she conflates structure with moral judgment. I recommend one more session focused on catharsis. — Aristotle"

Weak assessment (would be "Not Yet", rating 2):
"This student can recite my definitions but cannot use them. When I asked him to apply my theory of comedy to reality television, he said 'it's not real comedy because it's mean.' That is a moral judgment, not an analytical one — he is importing modern ethics rather than reasoning within my framework. He needs to re-read the Poetics with attention to the distinction between imitation and documentation. I would not yet say he understands my theory of comedy. — Aristotle"

YOU MUST respond with valid JSON in exactly this format:
{
  "letter": "The full assessment letter text here...",
  "verdictBadge": "Understood|Promising|Partial|Not Yet",
  "philosopherRating": 1-5
}

Respond ONLY with the JSON object. No markdown, no code fences, no extra text.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { philosopherId, topicId, selfAssessmentScore } = body;

  // Accept either a transcript string or messages array
  let transcript: string;
  if (body.transcript) {
    transcript = body.transcript;
  } else if (body.messages && Array.isArray(body.messages)) {
    transcript = body.messages
      .map((m: { role: string; content: string }) =>
        `${m.role === 'assistant' ? 'Philosopher' : 'Student'}: ${m.content}`
      )
      .join('\n\n');
  } else {
    return NextResponse.json(
      { error: 'Missing required field: transcript or messages' },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server API key not configured. The site owner needs to set ANTHROPIC_API_KEY.' },
      { status: 401 }
    );
  }

  if (!philosopherId || !topicId) {
    return NextResponse.json(
      { error: 'Missing required fields: philosopherId, topicId' },
      { status: 400 }
    );
  }

  const userMessage = `Philosopher: ${philosopherId}
Topic: ${topicId}
Student's self-assessment score: ${selfAssessmentScore ?? 'not provided'}/5

TRANSCRIPT:
${transcript}

Now write the assessment as ${philosopherId}. Remember: respond with ONLY the JSON object.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: ASSESSMENT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.text();
      console.error('Learn assess API error:', response.status, error);
      return NextResponse.json(
        { error: `API error ${response.status}: ${error.slice(0, 200)}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawText = data.content[0]?.text || '';

    // Parse the JSON response from the LLM
    try {
      // Strip any markdown code fences if the model wraps them despite instructions
      const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);

      // Validate and normalize the response
      const validBadges = ['Understood', 'Promising', 'Partial', 'Not Yet'];
      const verdictBadge = validBadges.includes(parsed.verdictBadge)
        ? parsed.verdictBadge
        : 'Partial';

      const philosopherRating = typeof parsed.philosopherRating === 'number'
        ? Math.min(5, Math.max(1, Math.round(parsed.philosopherRating)))
        : 3;

      return NextResponse.json({
        letter: parsed.letter || rawText,
        verdictBadge,
        philosopherRating,
      });
    } catch {
      // If JSON parsing fails, return the raw text as the letter with defaults
      console.error('Failed to parse assessment JSON, returning raw text');
      return NextResponse.json({
        letter: rawText,
        verdictBadge: 'Partial',
        philosopherRating: 3,
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: msg.includes('abort') ? 'Request timed out' : `Error: ${msg}` },
      { status: 500 }
    );
  }
}
