import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, systemPrompt } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server API key not configured. The site owner needs to set ANTHROPIC_API_KEY.' },
      { status: 401 }
    );
  }

  if (!messages || !systemPrompt) {
    return NextResponse.json(
      { error: 'Missing required fields: messages, systemPrompt' },
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
