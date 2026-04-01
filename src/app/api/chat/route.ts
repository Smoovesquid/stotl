import { NextRequest, NextResponse } from 'next/server';
import { ARISTOTLE_SYSTEM_PROMPT } from '@/lib/aristotle-prompt';

export async function POST(req: NextRequest) {
  const { messages, isFirstSession, apiKey: clientKey } = await req.json();

  // Accept key from client (one-time purchase model) or fall back to env
  const apiKey = clientKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'No API key. Go to /setup to configure.' },
      { status: 401 }
    );
  }

  const claudeMessages = messages.length === 0 && isFirstSession
    ? [{ role: 'user' as const, content: '[A new person has connected. Speak first. Follow your system prompt instructions for greeting a new user.]' }]
    : messages;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

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
        system: ARISTOTLE_SYSTEM_PROMPT,
        messages: claudeMessages,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', response.status, error);
      return NextResponse.json(
        { error: `API error ${response.status}: ${error.slice(0, 200)}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aristotleResponse = data.content[0]?.text || '...the signal falters.';

    return NextResponse.json({ response: aristotleResponse });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: msg.includes('abort') ? 'Timed out reaching Aristotle' : `Signal lost: ${msg}` },
      { status: 500 }
    );
  }
}
