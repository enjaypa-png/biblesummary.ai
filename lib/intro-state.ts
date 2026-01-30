/**
 * Intro State Management
 * 
 * Manages the first-time user experience (FTUE) state.
 * Uses localStorage for fast client-side checks and optionally syncs to Supabase.
 */

const INTRO_STATE_KEY = 'biblesummary_intro_state';

export interface IntroState {
  hasSeenIntro: boolean;
  lastSeenAt: string | null;
  skipped: boolean;
  version: number; // For future intro updates
}

const DEFAULT_STATE: IntroState = {
  hasSeenIntro: false,
  lastSeenAt: null,
  skipped: false,
  version: 1,
};

/**
 * Get intro state from localStorage
 */
export function getIntroState(): IntroState {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }

  try {
    const stored = localStorage.getItem(INTRO_STATE_KEY);
    if (!stored) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(stored) as IntroState;
    return { ...DEFAULT_STATE, ...parsed };
  } catch (error) {
    console.error('Failed to parse intro state:', error);
    return DEFAULT_STATE;
  }
}

/**
 * Check if user has seen the intro
 */
export function hasSeenIntro(): boolean {
  return getIntroState().hasSeenIntro;
}

/**
 * Mark intro as completed
 */
export function markIntroComplete(skipped: boolean = false): void {
  if (typeof window === 'undefined') return;

  const state: IntroState = {
    hasSeenIntro: true,
    lastSeenAt: new Date().toISOString(),
    skipped,
    version: 1,
  };

  try {
    localStorage.setItem(INTRO_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save intro state:', error);
  }
}

/**
 * Reset intro state (for testing or settings)
 */
export function resetIntroState(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(INTRO_STATE_KEY);
  } catch (error) {
    console.error('Failed to reset intro state:', error);
  }
}

/**
 * Sync intro state to Supabase user metadata (optional)
 * Call this after marking intro complete if user is authenticated
 */
export async function syncIntroStateToSupabase(
  supabaseClient: any,
  userId: string
): Promise<void> {
  try {
    const state = getIntroState();
    
    await supabaseClient.auth.updateUser({
      data: {
        has_seen_intro: state.hasSeenIntro,
        intro_completed_at: state.lastSeenAt,
        intro_skipped: state.skipped,
      },
    });
  } catch (error) {
    console.error('Failed to sync intro state to Supabase:', error);
    // Non-critical error, don't throw
  }
}

/**
 * Load intro state from Supabase user metadata (optional)
 * Use this to sync state across devices for authenticated users
 */
export async function loadIntroStateFromSupabase(
  supabaseClient: any
): Promise<IntroState | null> {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user?.user_metadata) {
      return null;
    }

    const metadata = user.user_metadata;
    
    if (metadata.has_seen_intro) {
      return {
        hasSeenIntro: metadata.has_seen_intro,
        lastSeenAt: metadata.intro_completed_at || null,
        skipped: metadata.intro_skipped || false,
        version: 1,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to load intro state from Supabase:', error);
    return null;
  }
}
