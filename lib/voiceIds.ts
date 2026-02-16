// Default narrator voice (Nicholas)
export const DEFAULT_VOICE_ID = "onwK4e9ZLuTAKqWW03F9";

// All available narrator voices
export const VOICE_IDS = [
  "onwK4e9ZLuTAKqWW03F9",
  "Xn1azbd8NmVXRrY94yrw",
  "vIpTnd6yyGAk2tJwEHLY",
  "iN4bGoWlozzDpJuOdZjH",
  "W0CVI7WJhHuV2vFY3VcB",
  "tPzOTlbmuCEa6h67Xb6k",
  "GTtzqc49rk4I6RwPWgd4",
  "hILdTfuUq4LRBMrxHERr",
  "h8LZpYr8y3VBz0q2x0LP",
  "zaV23R4Cs5kUdQb5M7eS",
] as const;

// Display name overrides (when ElevenLabs name should not be used)
export const VOICE_NAME_OVERRIDES: Record<string, string> = {
  "zaV23R4Cs5kUdQb5M7eS": "Nicholas",
};
