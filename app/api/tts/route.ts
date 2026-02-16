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

    // ElevenLabs streaming endpoint for real-time audio generation
    const elevenlabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: "eleven_turbo_v2",     // Fastest available model
          voice_settings: {
            stability: 0.85,        // Higher stability for speed
            similarity_boost: 0.9,   // Maximum similarity  
            style: 0.0,             // No style for fastest generation
            use_speaker_boost: true, // Enhanced clarity
          },
          output_format: "mp3_22050_32", // Optimized for streaming
          optimize_streaming_latency: 4, // Maximum latency optimization
        }),
      }
    );

    if (!elevenlabsResponse.ok) {
      const errorText = await elevenlabsResponse.text();
      console.error("ElevenLabs streaming error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate audio" }),
        { status: elevenlabsResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Stream the audio response directly back to client
    return new Response(elevenlabsResponse.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Connection": "keep-alive",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("TTS streaming error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
