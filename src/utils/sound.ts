// Gentle Web Audio API synthesized chimes for kid-friendly feedback without external audio files

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function playTone(frequency: number, duration: number, startTimeOffset = 0, gainPeak = 0.08, type: OscillatorType = 'sine') {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + startTimeOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function playClickSound(muted: boolean) {
  if (muted) return;
  playTone(523.25, 0.11, 0, 0.06, 'triangle'); // Soft C5
}

export function playLockedSound(muted: boolean) {
  if (muted) return;
  playTone(260, 0.12, 0, 0.05, 'sine');
  playTone(220, 0.14, 0.09, 0.04, 'sine');
}

export function playCorrectSound(muted: boolean) {
  if (muted) return;
  playTone(523.25, 0.16, 0, 0.07, 'triangle'); // C5
  playTone(659.25, 0.18, 0.09, 0.07, 'triangle'); // E5
  playTone(783.99, 0.28, 0.18, 0.08, 'triangle'); // G5
}

export function playTryAgainSound(muted: boolean) {
  if (muted) return;
  playTone(349.23, 0.15, 0, 0.05, 'sine');
  playTone(329.63, 0.2, 0.1, 0.05, 'sine');
}

export function playVictorySound(muted: boolean) {
  if (muted) return;
  playTone(523.25, 0.18, 0, 0.08, 'triangle'); // C5
  playTone(659.25, 0.18, 0.1, 0.08, 'triangle'); // E5
  playTone(783.99, 0.18, 0.2, 0.08, 'triangle'); // G5
  playTone(1046.5, 0.45, 0.3, 0.09, 'triangle'); // C6
}

export function playBeadTickSound(muted: boolean, accent = false) {
  if (muted) return;
  if (accent) {
    playTone(880, 0.12, 0, 0.055, 'sine');
    playTone(1318.5, 0.14, 0.03, 0.035, 'triangle');
  } else {
    playTone(698.46, 0.075, 0, 0.045, 'sine');
  }
}

export function playTasbihPhaseSound(muted: boolean) {
  if (muted) return;
  playTone(587.33, 0.16, 0, 0.06, 'sine'); // D5
  playTone(880, 0.26, 0.09, 0.07, 'triangle'); // A5
}

export function playPageFlipSound(enabled: boolean) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const duration = 0.11;
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      const env = Math.sin((i / frameCount) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1150, ctx.currentTime);
    filter.Q.setValueAtTime(0.85, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {
    // Ignore audio context restriction errors
  }
}

