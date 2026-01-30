# Complete Code Package for Claude

**Instructions:** Copy each code block below into the specified file path in your project.

---

## Step 1: Delete Old Files

First, delete these if they exist:
- `app/intro/` (entire directory)
- `lib/audio-utils.ts`

---

## Step 2: Create New Directory Structure

```bash
mkdir -p app/intro/components
```

---

## Step 3: Create Each File

### File 1: `lib/audio-utils.ts`

```typescript
/**
 * Enhanced Audio Utilities
 * 
 * Comprehensive audio handling with autoplay detection,
 * error handling, and user-friendly fallbacks.
 */

export interface AudioPlayOptions {
  volume?: number;
  onEnded?: () => void;
  onError?: (error: Error) => void;
  onPlay?: () => void;
}

/**
 * Detect whether the browser allows audio autoplay.
 * Tests by attempting to play a silent audio file.
 */
export async function canAutoplay(): Promise<boolean> {
  try {
    const audio = new Audio();
    audio.volume = 0;
    audio.muted = true;
    
    // Use a tiny silent data URI (empty WAV file)
    audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    
    await audio.play();
    audio.pause();
    audio.remove();
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Preload an audio file and return the HTMLAudioElement.
 * Returns null if the file doesn't exist or fails to load.
 */
export function preloadAudio(src: string): Promise<HTMLAudioElement | null> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = src;

    const handleSuccess = () => {
      cleanup();
      resolve(audio);
    };

    const handleError = () => {
      cleanup();
      resolve(null);
    };

    const cleanup = () => {
      audio.removeEventListener("canplaythrough", handleSuccess);
      audio.removeEventListener("error", handleError);
    };

    audio.addEventListener("canplaythrough", handleSuccess, { once: true });
    audio.addEventListener("error", handleError, { once: true });

    // Timeout after 10 seconds
    setTimeout(() => {
      cleanup();
      resolve(null);
    }, 10000);
  });
}

/**
 * Play an audio element with proper error handling and callbacks.
 * Returns true if playback started successfully, false otherwise.
 */
export async function playAudio(
  audio: HTMLAudioElement,
  options: AudioPlayOptions = {}
): Promise<boolean> {
  const {
    volume = 1,
    onEnded,
    onError,
    onPlay,
  } = options;

  try {
    // Set volume
    audio.volume = Math.max(0, Math.min(1, volume));

    // Attach event listeners
    if (onEnded) {
      audio.addEventListener("ended", onEnded, { once: true });
    }

    if (onError) {
      audio.addEventListener("error", (e) => {
        onError(new Error("Audio playback error"));
      }, { once: true });
    }

    if (onPlay) {
      audio.addEventListener("play", onPlay, { once: true });
    }

    // Attempt to play
    await audio.play();
    return true;
  } catch (error) {
    // Playback failed (likely autoplay blocked)
    if (onError && error instanceof Error) {
      onError(error);
    }
    return false;
  }
}

/**
 * Get a user-friendly error message for audio errors.
 */
export function getAudioErrorMessage(error: Error | unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("autoplay") || message.includes("user gesture")) {
      return "Audio requires interaction. Tap the play button to continue.";
    }

    if (message.includes("not found") || message.includes("404")) {
      return "Audio file not found. Continuing without audio.";
    }

    if (message.includes("network") || message.includes("fetch")) {
      return "Network error loading audio. Check your connection.";
    }

    if (message.includes("decode") || message.includes("format")) {
      return "Audio format not supported. Continuing without audio.";
    }
  }

  return "Unable to play audio. Continuing without sound.";
}

/**
 * Check if audio file exists at the given URL.
 * Useful for conditionally showing audio controls.
 */
export async function audioFileExists(src: string): Promise<boolean> {
  try {
    const response = await fetch(src, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Create an audio element with fade-in effect.
 */
export function createFadingAudio(
  src: string,
  targetVolume: number = 0.7,
  fadeDuration: number = 1000
): HTMLAudioElement {
  const audio = new Audio(src);
  audio.volume = 0;

  // Fade in
  const steps = 20;
  const stepDuration = fadeDuration / steps;
  const volumeStep = targetVolume / steps;

  let currentStep = 0;
  const fadeInterval = setInterval(() => {
    currentStep++;
    audio.volume = Math.min(targetVolume, volumeStep * currentStep);

    if (currentStep >= steps) {
      clearInterval(fadeInterval);
    }
  }, stepDuration);

  return audio;
}

/**
 * Fade out and stop an audio element.
 */
export function fadeOutAudio(
  audio: HTMLAudioElement,
  fadeDuration: number = 1000
): Promise<void> {
  return new Promise((resolve) => {
    const startVolume = audio.volume;
    const steps = 20;
    const stepDuration = fadeDuration / steps;
    const volumeStep = startVolume / steps;

    let currentStep = 0;
    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(0, startVolume - (volumeStep * currentStep));

      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        audio.pause();
        audio.currentTime = 0;
        resolve();
      }
    }, stepDuration);
  });
}
```

---

### File 2: `app/intro/layout.tsx`

```typescript
export default function IntroLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {children}
    </div>
  );
}
```

---

**(Continue in next message due to length...)**
