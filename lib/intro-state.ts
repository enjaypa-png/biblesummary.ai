const INTRO_KEY = "biblesummary_has_seen_intro";

export function hasSeenIntro(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(INTRO_KEY) === "true";
}

export function markIntroComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(INTRO_KEY, "true");
}

export function resetIntro(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(INTRO_KEY);
}
