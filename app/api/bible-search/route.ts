import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "edge";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

interface MatchVerseRow {
  book_id: string;
  chapter: number;
  verse: number;
  text: string | null;
  modern_text: string | null;
  similarity?: number;
  score?: number;
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

  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

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

    // 2) Call Supabase match_verses RPC
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.rpc("match_verses", {
      query_embedding: embedding,
      match_count: 10,
    });

    if (error) {
      console.error("[bible-search] match_verses error:", error);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 },
      );
    }

    const rows = (data || []) as MatchVerseRow[];
    const verses = rows.map((row) => ({
      book_id: row.book_id,
      chapter: row.chapter,
      verse: row.verse,
      text: row.text,
      modern_text: row.modern_text,
      similarity: row.similarity ?? row.score ?? null,
    }));

    return NextResponse.json({ verses });
  } catch (err) {
    console.error("[bible-search] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

