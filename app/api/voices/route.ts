import { NextResponse } from "next/server";
import { VOICE_IDS } from "@/contexts/ReadingSettingsContext";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";

interface VoiceInfo {
  id: string;
  name: string;
}

// Cache voice metadata in memory (refreshes on server restart)
let cachedVoices: VoiceInfo[] | null = null;

export async function GET() {
  if (!ELEVENLABS_API_KEY) {
    // Return IDs as names when no API key is configured
    return NextResponse.json(
      VOICE_IDS.map((id) => ({ id, name: id.slice(0, 8) }))
    );
  }

  if (cachedVoices) {
    return NextResponse.json(cachedVoices);
  }

  try {
    const results = await Promise.all(
      VOICE_IDS.map(async (id) => {
        try {
          const res = await fetch(`https://api.elevenlabs.io/v1/voices/${id}`, {
            headers: { "xi-api-key": ELEVENLABS_API_KEY },
          });
          if (!res.ok) return { id, name: id.slice(0, 8) };
          const data = await res.json();
          return { id, name: data.name || id.slice(0, 8) };
        } catch {
          return { id, name: id.slice(0, 8) };
        }
      })
    );

    cachedVoices = results;
    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      VOICE_IDS.map((id) => ({ id, name: id.slice(0, 8) })),
      { status: 500 }
    );
  }
}
