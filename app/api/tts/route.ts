import { NextRequest } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
// Default to Daniel — warm, calming voice ideal for Scripture reading
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "onwK4e9ZLuTAKqWW03F9";

export async function POST(req: NextRequest) {
  if (!ELEVENLABS_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ElevenLabs API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ElevenLabs streaming endpoint for real-time audio generation
    const elevenlabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.75,        // Slightly more stable for consistent reading
            similarity_boost: 0.85,  // Higher similarity to voice samples
            style: 0.1,             // Subtle expression for Scripture
            use_speaker_boost: true, // Enhanced clarity for spoken text
          },
          output_format: "mp3_22050_32", // Optimized for streaming
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
