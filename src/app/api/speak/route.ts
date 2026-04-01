import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { text, apiKey: clientKey, voiceId: clientVoiceId } = await req.json();

  // Accept keys from client (one-time purchase model) or fall back to env
  const apiKey = clientKey || process.env.ELEVENLABS_API_KEY;
  const voiceId = clientVoiceId || process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs error:', response.status, error);
      return NextResponse.json({ error: 'Voice generation failed' }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Speak error:', error);
    return NextResponse.json({ error: 'Voice failed' }, { status: 500 });
  }
}
