import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "edge";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const ANSWER_SYSTEM_PROMPT = `You answer questions about the Bible in plain, clear English for someone who is curious but may not have grown up in church.

Rules:
- 3-5 sentences. No more.
- Plain English only. No jargon, no church-speak, no theological terms without explanation.
- No preaching, no "you should", no moral lessons directed at the reader.
- Historical or cultural context is welcome if it helps the answer click.
- Base your answer ONLY on the Bible verses provided as context. Do not invent or assume content.
- If the verses don't contain enough information to answer, say so honestly.
- Do not start with "According to the Bible..." — just answer directly.
- Reference specific books/chapters when relevant (e.g. "In Judges 13-16...").`;

interface MatchVerseRow {
  book_id: string;
  chapter: number;
  verse: number;
  text: string | null;
  modern_text: string | null;
  similarity?: number;
  score?: number;
  translation?: string;
}

interface BookRow {
  id: string;
  name: string;
  slug: string;
}

export async function POST(req: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 },
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
      { status: 500 },
    );
  }

  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const query = (body.query || "").trim();
  if (!query) {
    return NextResponse.json(
      { error: "Missing 'query' in request body" },
      { status: 400 },
    );
  }

  // ── Auth + entitlement check ──
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "AI Bible Search is a premium feature. Please upgrade to access.", code: "PAYWALL" },
      { status: 403 },
    );
  }

  const preAuthSupabase = createClient(supabaseUrl, supabaseKey);
  const accessToken = authHeader.slice(7);
  const {
    data: { user: authUser },
    error: authError,
  } = await preAuthSupabase.auth.getUser(accessToken);

  if (authError || !authUser) {
    return NextResponse.json(
      { error: "AI Bible Search is a premium feature. Please upgrade to access.", code: "PAYWALL" },
      { status: 403 },
    );
  }

  const { data: hasAccess } = await preAuthSupabase.rpc("user_has_explain_access", {
    p_user_id: authUser.id,
  });

  if (hasAccess !== true) {
    return NextResponse.json(
      { error: "AI Bible Search is a premium feature. Please upgrade to access.", code: "PAYWALL" },
      { status: 403 },
    );
  }

  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1) Embed the natural language query
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const embedding = embeddingRes.data[0]?.embedding;
    if (!embedding) {
      return NextResponse.json(
        { error: "Failed to generate embedding" },
        { status: 500 },
      );
    }

    // 2) Call Supabase match_verses RPC (returns both KJV and CT)
    const { data, error } = await supabase.rpc("match_verses", {
      query_embedding: embedding,
      match_count: 20,
    });

    if (error) {
      console.error("[bible-search] match_verses error:", error);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 },
      );
    }

    const rows = (data || []) as MatchVerseRow[];

    // 3) Deduplicate: keep one result per book_id+chapter+verse (prefer CT / modern_text)
    const seen = new Map<string, MatchVerseRow>();
    for (const row of rows) {
      const key = `${row.book_id}:${row.chapter}:${row.verse}`;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, row);
      } else {
        // Prefer the row that has modern_text (CT), or the higher similarity
        if (row.modern_text && !existing.modern_text) {
          seen.set(key, row);
        } else if ((row.similarity ?? row.score ?? 0) > (existing.similarity ?? existing.score ?? 0)) {
          seen.set(key, row);
        }
      }
    }
    const uniqueRows = Array.from(seen.values())
      .sort((a, b) => (b.similarity ?? b.score ?? 0) - (a.similarity ?? a.score ?? 0))
      .slice(0, 8);

    // 4) Resolve book IDs to names and slugs
    const bookIds = Array.from(new Set(uniqueRows.map((r) => r.book_id)));
    const { data: booksData } = await supabase
      .from("books")
      .select("id, name, slug")
      .in("id", bookIds);

    const bookMap = new Map<string, BookRow>();
    if (booksData) {
      for (const b of booksData as BookRow[]) {
        bookMap.set(b.id, b);
      }
    }

    const verses = uniqueRows.map((row) => {
      const book = bookMap.get(row.book_id);
      return {
        book_id: row.book_id,
        book_name: book?.name || "Unknown",
        book_slug: book?.slug || row.book_id,
        chapter: row.chapter,
        verse: row.verse,
        text: row.modern_text || row.text,
        reference: book
          ? `${book.name} ${row.chapter}:${row.verse}`
          : `${row.chapter}:${row.verse}`,
      };
    });

    // 5) Generate an AI answer using the top verses as context
    const verseContext = verses
      .slice(0, 6)
      .map((v) => `${v.reference}: "${v.text}"`)
      .join("\n\n");

    const answerRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: ANSWER_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Question: "${query}"\n\nRelevant Bible verses:\n${verseContext}\n\nAnswer the question using these verses as your source.`,
          },
        ],
        max_tokens: 250,
        temperature: 0.3,
      }),
    });

    let answer: string | null = null;
    if (answerRes.ok) {
      const answerData = await answerRes.json();
      answer = answerData.choices?.[0]?.message?.content?.trim() || null;
    } else {
      console.error("[bible-search] GPT answer error:", answerRes.status);
    }

    return NextResponse.json({ answer, verses });
  } catch (err) {
    console.error("[bible-search] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
