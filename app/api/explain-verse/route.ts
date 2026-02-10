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

// Parse verse_id format: "Genesis.1.1" -> { book: "Genesis", chapter: 1, verse: 1 }
function parseVerseId(verseId: string): { book: string; chapter: number; verse: number } | null {
  const parts = verseId.split(".");
  if (parts.length < 3) return null;

  // Handle book names with spaces (e.g., "1 John.1.1" stored as "1 John")
  const verse = parseInt(parts[parts.length - 1], 10);
  const chapter = parseInt(parts[parts.length - 2], 10);
  const book = parts.slice(0, -2).join(".");

  if (isNaN(chapter) || isNaN(verse) || !book) return null;

  return { book, chapter, verse };
}

export async function POST(req: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    const { verse_id } = await req.json();

    if (!verse_id || typeof verse_id !== "string") {
      return NextResponse.json(
        { error: "Missing required field: verse_id" },
        { status: 400 }
      );
    }

    const parsed = parseVerseId(verse_id);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid verse_id format. Expected: Book.Chapter.Verse (e.g., Genesis.1.1)" },
        { status: 400 }
      );
    }

    const { book, chapter, verse } = parsed;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── Entitlement check: require active explain subscription ──
    // Client sends Supabase access token via Authorization header.
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.slice(7);
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const userId = authUser.id;

    // Check explain entitlement
    const { data: hasAccess } = await supabase.rpc("user_has_explain_access", {
      p_user_id: userId,
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Explain subscription required", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 }
      );
    }

    // Check explanation cache first
    const { data: cachedExplanation } = await supabase
      .from("explanations")
      .select("explanation")
      .eq("verse_id", verse_id)
      .single();

    if (cachedExplanation?.explanation) {
      return NextResponse.json({
        verse_id,
        explanation: cachedExplanation.explanation
      });
    }

    // Look up book by name to get book_id
    const { data: bookData, error: bookError } = await supabase
      .from("books")
      .select("id, name")
      .eq("name", book)
      .single();

    if (bookError || !bookData) {
      return NextResponse.json(
        { error: `Book not found: ${book}` },
        { status: 404 }
      );
    }

    // Fetch verse text from database
    const { data: verseData, error: verseError } = await supabase
      .from("verses")
      .select("text")
      .eq("book_id", bookData.id)
      .eq("chapter", chapter)
      .eq("verse", verse)
      .single();

    if (verseError || !verseData) {
      return NextResponse.json(
        { error: `Verse not found: ${verse_id}` },
        { status: 404 }
      );
    }

    const verseText = verseData.text;

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
          { role: "user", content: `Explain ONLY this single verse: "${verseText}" (${bookData.name} ${chapter}:${verse})` },
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
    await supabase
      .from("explanations")
      .upsert({
        verse_id: verse_id,
        explanation: explanation,
      }, {
        onConflict: "verse_id",
      });

    return NextResponse.json({
      verse_id,
      explanation
    });
  } catch (error) {
    console.error("Explain verse error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
