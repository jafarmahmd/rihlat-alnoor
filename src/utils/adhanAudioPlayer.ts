import { getMuezzinByRawName } from '../config/muezzins';
import {
  AdhanSchedulerPlugin,
  isCustomAdhanPluginAvailable,
} from '../plugins/adhanNativePlugin';
import { playCorrectSound } from './sound';

export interface AdhanPlaybackState {
  isPlaying: boolean;
  source: 'in-app' | 'native' | null;
  muezzinRawName: string | null;
  label: string | null;
}

const STATE_EVENT = 'rihlat:adhan-playback-state';

let activeAudioEl: HTMLAudioElement | null = null;
let currentState: AdhanPlaybackState = {
  isPlaying: false,
  source: null,
  muezzinRawName: null,
  label: null,
};

function emitState(next: AdhanPlaybackState): void {
  currentState = next;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: next }));
  }
}

export function getAdhanPlaybackState(): AdhanPlaybackState {
  return currentState;
}

export function subscribeAdhanPlaybackState(
  cb: (state: AdhanPlaybackState) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<AdhanPlaybackState>;
    if (custom.detail) cb(custom.detail);
  };
  window.addEventListener(STATE_EVENT, handler);
  return () => window.removeEventListener(STATE_EVENT, handler);
}

export function syncNativeAdhanStateFromPlugin(
  isPlaying: boolean,
  label?: string,
  muezzinRawName?: string
): void {
  if (isPlaying) {
    emitState({
      isPlaying: true,
      source: 'native',
      muezzinRawName: muezzinRawName || null,
      label: label || 'الأذان قيد التشغيل',
    });
  } else if (currentState.source === 'native') {
    emitState({
      isPlaying: false,
      source: null,
      muezzinRawName: null,
      label: null,
    });
  }
}

export async function stopAnyAdhanPlayback(): Promise<void> {
  if (activeAudioEl) {
    try {
      activeAudioEl.pause();
      activeAudioEl.currentTime = 0;
    } catch {
      // Ignore audio element stop errors
    }
    activeAudioEl = null;
  }

  if (isCustomAdhanPluginAvailable()) {
    try {
      await AdhanSchedulerPlugin.stopAdhan();
    } catch {
      // Ignore native stop error
    }
  }

  emitState({
    isPlaying: false,
    source: null,
    muezzinRawName: null,
    label: null,
  });
}

/**
 * يشغّل ملف الأذان المحلي للمؤذن بدون أي روابط خارجية.
 * عند فشل التشغيل (إن كان الملف مفقوداً) يعود لنغمة لطيفة دون تعطل.
 */
export async function playLocalMuezzinPreview(
  rawName: string,
  customLabel?: string
): Promise<boolean> {
  const muezzin = getMuezzinByRawName(rawName);
  await stopAnyAdhanPlayback();

  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    playCorrectSound(false);
    return false;
  }

  try {
    const audio = new Audio(muezzin.localAudioPath);
    audio.preload = 'auto';
    activeAudioEl = audio;

    audio.addEventListener('ended', () => {
      if (activeAudioEl === audio) {
        activeAudioEl = null;
        emitState({
          isPlaying: false,
          source: null,
          muezzinRawName: null,
          label: null,
        });
      }
    });

    audio.addEventListener('error', () => {
      if (activeAudioEl === audio) {
        activeAudioEl = null;
        emitState({
          isPlaying: false,
          source: null,
          muezzinRawName: null,
          label: null,
        });
        playCorrectSound(false);
      }
    });

    emitState({
      isPlaying: true,
      source: 'in-app',
      muezzinRawName: muezzin.rawName,
      label: customLabel || `أذان بصوت ${muezzin.displayName}`,
    });

    await audio.play();
    return true;
  } catch {
    activeAudioEl = null;
    emitState({
      isPlaying: false,
      source: null,
      muezzinRawName: null,
      label: null,
    });
    playCorrectSound(false);
    return false;
  }
}

export function playGentleReminderChime(): void {
  playCorrectSound(false);
}
