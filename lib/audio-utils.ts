/**
 * Detect whether the browser allows audio autoplay.
 * Creates a silent audio context and checks if it starts in "running" state.
 */
export async function canAutoplay(): Promise<boolean> {
  try {
    const audio = new Audio();
    audio.volume = 0;
    audio.muted = true;
    // Use a tiny silent data URI to test
    audio.src =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    const result = await audio.play();
    audio.pause();
    audio.remove();
    return true;
  } catch {
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
    audio.addEventListener("canplaythrough", () => resolve(audio), {
      once: true,
    });
    audio.addEventListener("error", () => resolve(null), { once: true });
  });
}
