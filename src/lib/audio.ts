// Single AudioContext for all audio (portal effects + voice playback)
// iOS requires AudioContext to be created after user gesture

let audioContext: AudioContext | null = null;
let humNode: OscillatorNode | null = null;
let noiseNode: AudioBufferSourceNode | null = null;
let gainNode: GainNode | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export async function resumeAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

// Start the ambient portal hum (low drone + filtered white noise)
export function startAmbientHum(): void {
  const ctx = getAudioContext();
  gainNode = ctx.createGain();
  gainNode.gain.value = 0;
  gainNode.connect(ctx.destination);

  // Low frequency hum (80Hz sine wave, very quiet)
  humNode = ctx.createOscillator();
  humNode.type = 'sine';
  humNode.frequency.value = 80;
  const humGain = ctx.createGain();
  humGain.gain.value = 0.03; // 3% volume
  humNode.connect(humGain);
  humGain.connect(gainNode);
  humNode.start();

  // White noise through a low-pass filter (static/crackle)
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;
  noiseNode.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.02; // 2% volume

  noiseNode.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(gainNode);
  noiseNode.start();

  // Fade in over 2 seconds
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + 2);
}

// Fade out and stop ambient audio
export function stopAmbientHum(): void {
  if (gainNode && audioContext) {
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 3);
    setTimeout(() => {
      humNode?.stop();
      noiseNode?.stop();
      humNode = null;
      noiseNode = null;
      gainNode = null;
    }, 3500);
  }
}

// Adjust ambient volume based on connection state
export function setAmbientLevel(level: 'reaching' | 'connected' | 'lost'): void {
  if (!gainNode || !audioContext) return;
  const now = audioContext.currentTime;
  switch (level) {
    case 'reaching':
      gainNode.gain.linearRampToValueAtTime(1.5, now + 0.5); // louder during reaching
      break;
    case 'connected':
      gainNode.gain.linearRampToValueAtTime(0.5, now + 0.5); // quieter when talking
      break;
    case 'lost':
      gainNode.gain.linearRampToValueAtTime(2, now + 0.3); // loud burst then fade
      setTimeout(() => {
        gainNode?.gain.linearRampToValueAtTime(0.3, (audioContext?.currentTime ?? 0) + 2);
      }, 500);
      break;
  }
}
