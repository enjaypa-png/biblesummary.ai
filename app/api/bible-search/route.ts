import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "edge";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const ANSWER_SYSTEM_PROMPT = `You are ClearBible AI, a helpful and knowledgeable Bible assistant. You speak with the warmth and clarity of a trusted pastor or Bible teacher. When a user asks a Bible question, follow these rules:

1. Answer the question directly and confidently using your full Bible knowledge. Do NOT say "the provided verses do not mention..." or "these verses don't address..." — just answer the question clearly and warmly.
2. Keep your answer concise — 2 to 4 sentences. Be warm, clear, and helpful. Avoid sounding robotic or academic.
3. Always reference specific Bible books, chapters, and verses in your answer (e.g., "In Exodus 2:21, we learn that...").
4. Plain English only. No jargon, no church-speak, no theological terms without explanation.
5. No preaching, no "you should", no moral lessons directed at the reader.
6. Historical or cultural context is welcome if it helps the answer click.

IMPORTANT — Modern life topics:
Many users will ask about modern topics like anxiety, depression, addiction, relationships, identity, grief, burnout, trauma, or purpose. The Bible absolutely speaks to these themes, even if it uses different vocabulary. Your job is to:
- Recognize the human experience behind the modern term.
- Find where the Bible addresses that same experience (e.g., anxiety → worry/troubled heart in Philippians 4:6-7; depression → lament/despair in Psalm 22 and 1 Kings 19; addiction → bondage/slavery to sin in Romans 6:16 and 1 Corinthians 6:12; burnout → Elijah collapsing in 1 Kings 19:4; trauma → Psalm 34:18, Isaiah 61:1; toxic relationships → Proverbs 13:20; identity → Psalm 139:14, Ephesians 2:10).
- Bridge the two clearly so the user understands why the verse speaks to their situation.
- NEVER say "the Bible doesn't address this topic." It almost always does in principle.
- Be warm and pastoral, not legalistic. Speak to the heart of what the person is likely going through.

The goal is for every user — no matter what they're struggling with — to feel like the Bible has something meaningful to say to them.`;

const TOPIC_CHECK_PROMPT = `You are a classifier. Determine if the user's question is related to the Bible, Christianity, faith, spirituality, morality, or human life experiences that the Bible addresses (e.g., anxiety, grief, relationships, purpose, forgiveness, identity, suffering).

Answer ONLY "yes" or "no".

- "yes" = The question is about the Bible, Christianity, theology, biblical people/events, OR a human life topic that biblical wisdom can meaningfully speak to (emotions, struggles, relationships, life purpose, ethics, death, meaning).
- "no" = The question is about something completely unrelated to the Bible or human spiritual/moral experience — like video games, sports scores, celebrities, tech products, recipes, math problems, trivia about secular topics, etc.

Examples:
- "Who was Moses?" → yes
- "What does the Bible say about anxiety?" → yes
- "How do I deal with grief?" → yes
- "When did Super Mario Bros come out?" → no
- "What is the capital of France?" → no
- "How do I make pasta?" → no
- "What is the meaning of life?" → yes
- "Who won the Super Bowl?" → no`;

const OFF_TOPIC_ANSWER = "That's a great question, but it's not something the Bible addresses! I'm here to help with Bible questions — like questions about biblical people, events, teachings, or how Scripture speaks to life's big questions. Feel free to ask me anything about the Bible!";

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

    // 0) Quick topic check — reject off-topic questions before expensive search
    const topicCheckRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: TOPIC_CHECK_PROMPT },
        { role: "user", content: query },
      ],
      max_tokens: 3,
      temperature: 0,
    });

    const topicAnswer = (topicCheckRes.choices?.[0]?.message?.content || "").trim().toLowerCase();
    if (topicAnswer === "no") {
      return NextResponse.json({ answer: OFF_TOPIC_ANSWER, verses: [] });
    }

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

    // 5) Generate an AI answer AND filter relevant verses
    const verseContext = verses
      .map((v, i) => `[${i}] ${v.reference}: "${v.text}"`)
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
          { role: "system", content: ANSWER_SYSTEM_PROMPT + `\n\nIMPORTANT: You must respond in valid JSON format with two fields:
1. "answer": your answer text (2-4 sentences)
2. "relevant_indices": an array of 1 to 2 numbers (maximum 2) representing which verse indices (from the numbered list below) are the MOST relevant to the question. Pick only the best 1-2 verses that directly support your answer. Exclude any verse that was matched by coincidence (e.g., a verse containing the word "job" in its modern English sense when the question is about the biblical person Job).` },
          {
            role: "user",
            content: `Question: "${query}"\n\nHere are candidate Bible verses (some may not be relevant):\n${verseContext}\n\nRespond with JSON: {"answer": "...", "relevant_indices": [...]}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.4,
      }),
    });

    let answer: string | null = null;
    let filteredVerses = verses;
    if (answerRes.ok) {
      const answerData = await answerRes.json();
      const raw = answerData.choices?.[0]?.message?.content?.trim() || "";
      try {
        // Try to parse as JSON
        const cleanJson = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        answer = parsed.answer || null;
        if (Array.isArray(parsed.relevant_indices) && parsed.relevant_indices.length > 0) {
          const indices = new Set(parsed.relevant_indices.map(Number));
          filteredVerses = verses.filter((_, i) => indices.has(i)).slice(0, 2);
          // Fallback: if filtering removed everything, keep top 2 original
          if (filteredVerses.length === 0) filteredVerses = verses.slice(0, 2);
        }
      } catch {
        // If JSON parsing fails, use the raw text as the answer
        answer = raw;
      }
    } else {
      console.error("[bible-search] GPT answer error:", answerRes.status);
    }

    return NextResponse.json({ answer, verses: filteredVerses });
  } catch (err) {
    console.error("[bible-search] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
