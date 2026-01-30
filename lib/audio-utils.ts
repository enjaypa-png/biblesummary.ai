/**
 * Audio Utilities
 * 
 * Handles audio playback with autoplay detection and fallback strategies.
 * iOS Safari and many mobile browsers block autoplay without user interaction.
 */

/**
 * Detect if autoplay is supported in the current browser
 */
export async function canAutoplay(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Create a silent audio element to test autoplay
    const audio = new Audio();
    audio.volume = 0;
    audio.muted = true;
    
    // Try to play
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      await playPromise;
      audio.pause();
      return true;
    }
    
    return false;
  } catch (error) {
    // Autoplay blocked
    return false;
  }
}

/**
 * Preload an audio file
 */
export function preloadAudio(src: string): HTMLAudioElement {
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = src;
  return audio;
}

/**
 * Play audio with error handling
 */
export async function playAudio(
  audio: HTMLAudioElement,
  options?: {
    volume?: number;
    onEnded?: () => void;
    onError?: (error: Error) => void;
  }
): Promise<boolean> {
  try {
    if (options?.volume !== undefined) {
      audio.volume = options.volume;
    }

    if (options?.onEnded) {
      audio.addEventListener('ended', options.onEnded, { once: true });
    }

    if (options?.onError) {
      audio.addEventListener('error', () => {
        options.onError?.(new Error('Audio playback failed'));
      }, { once: true });
    }

    await audio.play();
    return true;
  } catch (error) {
    console.error('Audio playback failed:', error);
    options?.onError?.(error as Error);
    return false;
  }
}

/**
 * Get user-friendly audio error message
 */
export function getAudioErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('autoplay') || message.includes('interact')) {
    return 'Please tap to enable audio';
  }
  
  if (message.includes('network') || message.includes('load')) {
    return 'Audio failed to load. Check your connection.';
  }
  
  return 'Audio playback unavailable';
}

/**
 * Check if device is likely iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Check if device is in silent mode (iOS only, approximate)
 */
export function isSilentMode(): boolean {
  // Note: There's no reliable way to detect silent mode on iOS
  // This is a best-effort approximation
  return false;
}

/**
 * Format audio duration (seconds to MM:SS)
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
