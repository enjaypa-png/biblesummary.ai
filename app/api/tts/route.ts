import { NextRequest } from "next/server";
import { VOICE_IDS, DEFAULT_VOICE_ID } from "@/lib/voiceIds";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const FALLBACK_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

export async function POST(req: NextRequest) {
  if (!ELEVENLABS_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ElevenLabs API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { text, voiceId } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate voice ID against allowed list, fallback to default
    const selectedVoice =
      voiceId && (VOICE_IDS as readonly string[]).includes(voiceId)
        ? voiceId
        : FALLBACK_VOICE_ID;

    // output_format is a query parameter, not a body parameter
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}/stream?output_format=mp3_44100_128`;

    const requestBody = {
      text: text.trim(),
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.85,
        similarity_boost: 0.9,
      },
    };

    console.log("[TTS] Request:", { voice: selectedVoice, model: requestBody.model_id, textLength: text.trim().length });

    const elevenlabsResponse = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(requestBody),
    });

    if (!elevenlabsResponse.ok) {
      const errorText = await elevenlabsResponse.text();
      console.error("[TTS] ElevenLabs error:", {
        status: elevenlabsResponse.status,
        statusText: elevenlabsResponse.statusText,
        body: errorText,
        voice: selectedVoice,
        model: requestBody.model_id,
      });
      return new Response(
        JSON.stringify({ error: "Failed to generate audio", detail: errorText }),
        { status: elevenlabsResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Stream the audio response directly back to client
    return new Response(elevenlabsResponse.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch (error) {
    console.error("[TTS] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
