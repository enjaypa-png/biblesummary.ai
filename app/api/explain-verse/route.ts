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

// Normalize book name to Title Case (e.g. "genesis" -> "Genesis", "1 samuel" -> "1 Samuel")
function toTitleCase(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Parse verse_id format: "Genesis.1.1" -> { book, chapter, verse_start, verse_end }
// Also accept optional verse_end for ranges.
function parseAndNormalize(input: {
  verse_id?: string;
  book?: string;
  chapter?: number;
  verse_start?: number;
  verse_end?: number | null;
}): { book: string; chapter: number; verse_start: number; verse_end: number | null } | null {
  if (input.verse_id && typeof input.verse_id === "string") {
    const parts = input.verse_id.trim().split(".");
    if (parts.length < 3) return null;
    const verse = parseInt(parts[parts.length - 1], 10);
    const chapter = parseInt(parts[parts.length - 2], 10);
    const book = parts.slice(0, -2).join(".").trim();
    if (isNaN(chapter) || isNaN(verse) || !book) return null;
    return {
      book: toTitleCase(book),
      chapter,
      verse_start: verse,
      verse_end: null,
    };
  }
  if (
    input.book != null &&
    input.chapter != null &&
    input.verse_start != null
  ) {
    const chapter = parseInt(String(input.chapter), 10);
    const verse_start = parseInt(String(input.verse_start), 10);
    const verse_end =
      input.verse_end != null
        ? parseInt(String(input.verse_end), 10)
        : null;
    if (isNaN(chapter) || isNaN(verse_start) || !input.book.trim()) return null;
    if (verse_end != null && isNaN(verse_end)) return null;
    return {
      book: toTitleCase(String(input.book).trim()),
      chapter,
      verse_start,
      verse_end,
    };
  }
  return null;
}

export async function POST(req: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const parsed = parseAndNormalize(body);

    if (!parsed) {
      return NextResponse.json(
        {
          error:
            "Invalid input. Provide verse_id (e.g. Genesis.1.1) or book, chapter, verse_start, optional verse_end.",
        },
        { status: 400 }
      );
    }

    const { book, chapter, verse_start, verse_end } = parsed;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── Entitlement check: require active explain subscription ──
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.slice(7);
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const { data: hasAccess } = await supabase.rpc("user_has_explain_access", {
      p_user_id: authUser.id,
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Explain subscription required", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 }
      );
    }

    // ── 2. Check database first (never call OpenAI if cache hit) ──
    let cacheQuery = supabase
      .from("verse_explanations")
      .select("explanation_text")
      .eq("book", book)
      .eq("chapter", chapter)
      .eq("verse_start", verse_start);

    if (verse_end === null) {
      cacheQuery = cacheQuery.is("verse_end", null);
    } else {
      cacheQuery = cacheQuery.eq("verse_end", verse_end);
    }

    const { data: cached } = await cacheQuery.limit(1).maybeSingle();

    if (cached?.explanation_text) {
      console.log("CACHE_HIT");
      const verse_id = verse_end === null
        ? `${book}.${chapter}.${verse_start}`
        : `${book}.${chapter}.${verse_start}-${verse_end}`;
      return NextResponse.json({
        verse_id,
        explanation: cached.explanation_text,
      });
    }

    // ── 3. Not found → generate with OpenAI ──
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

    const { data: verseData, error: verseError } = await supabase
      .from("verses")
      .select("text")
      .eq("book_id", bookData.id)
      .eq("chapter", chapter)
      .eq("verse", verse_start)
      .eq("translation", "kjv")
      .single();

    if (verseError || !verseData) {
      return NextResponse.json(
        { error: `Verse not found: ${book} ${chapter}:${verse_start}` },
        { status: 404 }
      );
    }

    const verseText = verseData.text;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Explain ONLY this single verse: "${verseText}" (${bookData.name} ${chapter}:${verse_start})`,
          },
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
    const generatedExplanation = data.choices?.[0]?.message?.content?.trim();

    if (!generatedExplanation || generatedExplanation === "UNABLE_TO_EXPLAIN") {
      return NextResponse.json(
        { error: "Unable to explain this verse" },
        { status: 400 }
      );
    }

    // ── 4. Insert into database (on conflict do nothing) ──
    await supabase.rpc("insert_verse_explanation", {
      p_book: book,
      p_chapter: chapter,
      p_verse_start: verse_start,
      p_verse_end: verse_end,
      p_explanation_text: generatedExplanation,
    });

    // ── 5. Return explanation ──
    console.log("AI_GENERATED");
    const verse_id =
      verse_end === null
        ? `${book}.${chapter}.${verse_start}`
        : `${book}.${chapter}.${verse_start}-${verse_end}`;
    return NextResponse.json({
      verse_id,
      explanation: generatedExplanation,
    });
  } catch (error) {
    console.error("Explain verse error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
