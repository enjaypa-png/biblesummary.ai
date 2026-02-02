import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
// Default to Asher Scripture — warm, calming voice for Bible reading
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "zaV23R4Cs5kUdQb5M7eS";

export async function POST(req: NextRequest) {
  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: "ElevenLabs API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // ElevenLabs has a 5000 char limit per request — chunk if needed
    const maxChars = 5000;
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= maxChars) {
        chunks.push(remaining);
        break;
      }
      // Split at the last sentence boundary before maxChars
      let splitAt = remaining.lastIndexOf(". ", maxChars);
      if (splitAt === -1 || splitAt < maxChars / 2) {
        splitAt = remaining.lastIndexOf(" ", maxChars);
      }
      if (splitAt === -1) splitAt = maxChars;
      chunks.push(remaining.slice(0, splitAt + 1));
      remaining = remaining.slice(splitAt + 1);
    }

    // Generate audio for each chunk
    const audioBuffers: Buffer[] = [];
    for (const chunk of chunks) {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: chunk,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.6,
              similarity_boost: 0.75,
              style: 0.15,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs error:", errorText);
        return NextResponse.json(
          { error: "Failed to generate audio" },
          { status: response.status }
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      audioBuffers.push(Buffer.from(arrayBuffer));
    }

    // Concatenate all audio buffers
    const combined = Buffer.concat(audioBuffers);

    return new NextResponse(combined, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
