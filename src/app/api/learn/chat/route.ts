import { NextRequest, NextResponse } from 'next/server';

// Server-side topic prompt lookup
async function getSystemPrompt(philosopherId: string, topicId: string, phase: string): Promise<string> {
  try {
    // Dynamic import of the topics file
    const mod = philosopherId === 'plato'
      ? await import('@/lib/personas/topics/plato-topics')
      : await import('@/lib/personas/topics/aristotle-topics');

    const topicsKey = Object.keys(mod).find((k) => k.endsWith('_TOPICS'));
    if (!topicsKey) throw new Error(`No topics found for ${philosopherId}`);

    const topics = mod[topicsKey as keyof typeof mod] as Array<{
      id: string;
      teachingPrompt: string;
      examinationPrompt: string;
    }>;

    const topic = topics.find((t) => t.id === topicId);
    if (!topic) throw new Error(`Topic ${topicId} not found for ${philosopherId}`);

    return phase === 'examination' ? topic.examinationPrompt : topic.teachingPrompt;
  } catch (err) {
    console.error('Failed to load topic prompt:', err);
    throw new Error(`Could not load prompt for ${philosopherId}/${topicId}`);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Support both formats: metadata-based (from learn page) and direct systemPrompt
  let systemPrompt: string;
  let messages: Array<{ role: string; content: string }>;

  if (body.systemPrompt) {
    // Direct format (backwards compat)
    systemPrompt = body.systemPrompt;
    messages = body.messages;
  } else if (body.philosopherId && body.topicId && body.phase) {
    // Metadata format (learn page)
    systemPrompt = await getSystemPrompt(body.philosopherId, body.topicId, body.phase);
    messages = body.messages;
  } else {
    return NextResponse.json(
      { error: 'Missing required fields: either (messages, systemPrompt) or (messages, philosopherId, topicId, phase)' },
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

  if (!messages) {
    return NextResponse.json(
      { error: 'Missing required field: messages' },
      { status: 400 }
    );
  }

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
        system: systemPrompt,
        messages,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.text();
      console.error('Learn chat API error:', response.status, error);
      return NextResponse.json(
        { error: `API error ${response.status}: ${error.slice(0, 200)}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.content[0]?.text || '...the philosopher is lost in thought.';

    return NextResponse.json({ response: text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: msg.includes('abort') ? 'Request timed out' : `Error: ${msg}` },
      { status: 500 }
    );
  }
}
