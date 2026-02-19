import { NextResponse } from "next/server";
import { VOICE_IDS, VOICE_OVERRIDES } from "@/lib/voiceIds";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";

interface VoiceInfo {
  id: string;
  name: string;
  description: string;
}

// Cache voice metadata in memory (refreshes on server restart)
let cachedVoices: VoiceInfo[] | null = null;

export async function GET() {
  if (cachedVoices) {
    return NextResponse.json(cachedVoices);
  }

  if (!ELEVENLABS_API_KEY) {
    // No API key — return local overrides or ID stubs
    const fallback = VOICE_IDS.map((id) => {
      const override = VOICE_OVERRIDES[id];
      return {
        id,
        name: override?.name || id.slice(0, 8),
        description: override?.description || "",
      };
    });
    return NextResponse.json(fallback);
  }

  try {
    const results = await Promise.all(
      VOICE_IDS.map(async (id) => {
        const override = VOICE_OVERRIDES[id];
        try {
          const res = await fetch(`https://api.elevenlabs.io/v1/voices/${id}`, {
            headers: { "xi-api-key": ELEVENLABS_API_KEY },
          });
          if (!res.ok) {
            return {
              id,
              name: override?.name || id.slice(0, 8),
              description: override?.description || "",
            };
          }
          const data = await res.json();

          // Build description from ElevenLabs labels if no local override
          const labels = data.labels || {};
          let desc = override?.description || "";
          if (!desc) {
            const parts: string[] = [];
            if (labels.accent) parts.push(labels.accent);
            if (labels.age) parts.push(labels.age);
            if (labels.gender) parts.push(labels.gender);
            if (labels.description) parts.push(labels.description);
            if (labels.use_case) parts.push(labels.use_case);
            desc = parts.join(", ");
          }

          return {
            id,
            name: override?.name || data.name || id.slice(0, 8),
            description: desc,
          };
        } catch {
          return {
            id,
            name: override?.name || id.slice(0, 8),
            description: override?.description || "",
          };
        }
      })
    );

    cachedVoices = results;
    return NextResponse.json(results);
  } catch {
    const fallback = VOICE_IDS.map((id) => {
      const override = VOICE_OVERRIDES[id];
      return {
        id,
        name: override?.name || id.slice(0, 8),
        description: override?.description || "",
      };
    });
    return NextResponse.json(fallback, { status: 500 });
  }
}
