// Default narrator voice (Nicholas)
export const DEFAULT_VOICE_ID = "zaV23R4Cs5kUdQb5M7eS";

// All available narrator voices
export const VOICE_IDS = [
  "zaV23R4Cs5kUdQb5M7eS",
  "Xn1azbd8NmVXRrY94yrw",
  "vIpTnd6yyGAk2tJwEHLY",
  "iN4bGoWlozzDpJuOdZjH",
  "W0CVI7WJhHuV2vFY3VcB",
  "tPzOTlbmuCEa6h67Xb6k",
  "GTtzqc49rk4I6RwPWgd4",
  "hILdTfuUq4LRBMrxHERr",
  "h8LZpYr8y3VBz0q2x0LP",
] as const;

// Local metadata overrides — merged with ElevenLabs API data at runtime.
// Any field set here takes priority over what the API returns.
export const VOICE_OVERRIDES: Record<string, { name?: string; description?: string }> = {
  "zaV23R4Cs5kUdQb5M7eS": {
    name: "Nicholas",
    description: "Calm, confident, firm elderly male",
  },
};
