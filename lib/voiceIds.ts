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
    description: "Smart, firm & calm — our signature narrator",
  },
  "Xn1azbd8NmVXRrY94yrw": {
    name: "Eleanor",
    description: "Warm, natural middle-aged female",
  },
  "vIpTnd6yyGAk2tJwEHLY": {
    name: "Dorothy",
    description: "Gentle, soothing grandmother's voice",
  },
  "iN4bGoWlozzDpJuOdZjH": {
    name: "Marcus",
    description: "Clear, steady American male",
  },
  "W0CVI7WJhHuV2vFY3VcB": {
    name: "Claire",
    description: "Confident, professional female",
  },
  "tPzOTlbmuCEa6h67Xb6k": {
    name: "Viktoria",
    description: "Rich, strong & expressive female",
  },
  "GTtzqc49rk4I6RwPWgd4": {
    name: "Gabby",
    description: "Gentle, warm storyteller",
  },
  "hILdTfuUq4LRBMrxHERr": {
    name: "Lamin",
    description: "Deep, calm & composed male",
  },
  "h8LZpYr8y3VBz0q2x0LP": {
    name: "Darryl",
    description: "Deep, confident & resonant male",
  },
};
