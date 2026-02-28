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

    // Use the non-streaming convert endpoint (more reliable on serverless)
    // output_format is a query parameter per ElevenLabs docs
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}?output_format=mp3_44100_128`;

    const elevenlabsResponse = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.85,
          similarity_boost: 0.9,
        },
      }),
    });

    if (!elevenlabsResponse.ok) {
      const errorText = await elevenlabsResponse.text();
      console.error("[TTS] ElevenLabs error:", elevenlabsResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: "TTS failed",
          status: elevenlabsResponse.status,
          detail: errorText,
        }),
        { status: elevenlabsResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Buffer the full audio response before sending to client
    const audioBuffer = await elevenlabsResponse.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch (error) {
    console.error("[TTS] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
