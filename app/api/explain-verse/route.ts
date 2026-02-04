import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const SYSTEM_PROMPT = `You explain single Bible verses in plain English. Follow these rules EXACTLY:
- 2-4 sentences maximum
- Plain English, neutral tone
- No theology, no preaching, no "you should"
- No cross-references to other verses
- Historical context OK if essential (1 sentence max)
- If impossible to explain: respond EXACTLY "UNABLE_TO_EXPLAIN"

Example format: "This verse describes [plain meaning]. In that era, [1 fact]. The statement emphasizes [core idea]."`;

export const runtime = "edge";

export async function POST(req: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { book, chapter, verse, verseText } = await req.json();

    if (!book || !chapter || !verse || !verseText) {
      return NextResponse.json(
        { error: "Missing required fields: book, chapter, verse, verseText" },
        { status: 400 }
      );
    }

    const verseId = `${book}.${chapter}.${verse}`;

    // Check Supabase cache first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: cachedExplanation } = await supabase
        .from("explanations")
        .select("explanation")
        .eq("verse_id", verseId)
        .single();

      if (cachedExplanation?.explanation) {
        return NextResponse.json({ explanation: cachedExplanation.explanation });
      }
    }

    // Generate explanation with OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Explain ONLY this single verse: "${verseText}" (${book} ${chapter}:${verse})` },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate explanation" },
        { status: 500 }
      );
    }

    const data = await openaiResponse.json();
    const explanation = data.choices?.[0]?.message?.content?.trim();

    if (!explanation || explanation === "UNABLE_TO_EXPLAIN") {
      return NextResponse.json(
        { error: "Unable to explain this verse" },
        { status: 400 }
      );
    }

    // Cache the result in Supabase
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from("explanations")
        .upsert({
          verse_id: verseId,
          explanation: explanation,
        }, {
          onConflict: "verse_id",
        });
    }

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Explain verse error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
