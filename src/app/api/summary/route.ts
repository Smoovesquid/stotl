import { NextRequest, NextResponse } from 'next/server';
import { ARISTOTLE_SUMMARY_PROMPT } from '@/lib/aristotle-prompt';

// Incremental summarization — called every 5 turns (fire-and-forget from client)
export async function POST(req: NextRequest) {
  const { messages, sessionNumber } = await req.json();

  let apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    try {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
      const match = content.match(/ANTHROPIC_API_KEY=(.+)/);
      if (match) apiKey = match[1].trim();
    } catch {}
  }
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key' }, { status: 500 });
  }

  // Build a transcript from the messages
  const transcript = messages
    .map((m: { role: string; content: string }) =>
      `${m.role === 'user' ? 'User' : 'Aristotle'}: ${m.content}`
    )
    .join('\n');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: ARISTOTLE_SUMMARY_PROMPT,
        messages: [{
          role: 'user',
          content: `Summarize this conversation (session ${sessionNumber}):\n\n${transcript}`,
        }],
      }),
    });

    if (!response.ok) {
      console.error('Summary API error:', await response.text());
      return NextResponse.json({ error: 'Summary failed' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content[0]?.text || '{}';

    // Parse the JSON summary
    let summary;
    try {
      summary = JSON.parse(text);
    } catch {
      // If Claude didn't return valid JSON, wrap it
      summary = {
        topics: [],
        user_positions: [],
        aristotle_challenges: [],
        growth_notes: text,
        session_number: sessionNumber,
      };
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary error:', error);
    return NextResponse.json({ error: 'Summary failed' }, { status: 500 });
  }
}
