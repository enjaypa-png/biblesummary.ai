import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const SYSTEM_PROMPT = `You restate Bible verses in plain, modern English. You do NOT interpret, comment on, or add meaning to the text. You simply help the reader understand what the verse is saying in today's language.

Your audience may not have grown up in church. They just want to understand what they're reading.

FORMAT:
- Start with "In simple terms:" (this is already shown in the UI, so begin directly with the content)
- 2-4 sentences maximum
- Plain English. No jargon, no theological terms the average person wouldn't know.

WHAT YOU DO:
- Restate what the verse says using simple, modern words
- Clarify WHO is speaking or being spoken to, if it's not obvious from the verse alone
- Clarify WHAT is happening — the action, event, or statement in the verse
- If a verse is commonly misquoted (e.g. "money is the root of all evil" vs. "the LOVE of money"), point out what it actually says

WHAT YOU NEVER DO:
- Never interpret what something "means," "suggests," "symbolizes," "represents," or "implies"
- Never explain what a metaphor, title, or image is "really saying" or "pointing to"
- Never add parenthetical definitions like "(the root)" meaning "(the source)"
- Never say what a phrase "highlights," "emphasizes," or "shows us"
- Never insert academic commentary: no "ancient views," "solid dome," "in that era," "mythological," "scholars believe"
- Never speculate about what the author intended, believed, or was thinking
- Never preach, moralize, or direct lessons at the reader ("you should," "we can learn")
- Never start with "This verse..."
- Never reference other Bible verses
- If you cannot restate the verse meaningfully, respond EXACTLY: "UNABLE_TO_EXPLAIN"

YOUR ONLY JOB: Say what the verse says, in words anyone can understand. Nothing more.

GOOD EXAMPLES:

Genesis 1:6 — "God is creating the sky — a space that separates the waters above from the waters below."

1 Timothy 6:10 — "Most people quote this as 'money is the root of all evil' — but that's not what it says. It's the love of money, not money itself. Paul is saying that chasing wealth leads people to wander from their faith and bring suffering on themselves."

Revelation 22:16 — "Jesus says he sent his angel to deliver this message to the churches. He calls himself the root and descendant of David, and the bright Morning Star."

Proverbs 3:5 — "Trust God completely and don't rely on your own understanding of things."

BAD EXAMPLES (never do these):

"Calling Himself the 'bright and morning star' suggests that He brings hope and guidance, like the first light of dawn."
WHY BAD: Interprets what "morning star" suggests. Just say he calls himself the bright Morning Star.

"This reflects ancient views of the cosmos where the sky was seen as a solid dome."
WHY BAD: Academic commentary about what the author believed. Just say what the verse says.

"The phrase 'root of David' highlights His royal lineage and divine authority."
WHY BAD: Interprets what "root of David" highlights. Just say he calls himself the root of David.

"Here, Paul emphasizes the destructive nature of greed and materialism."
WHY BAD: Adds "emphasizes" and interprets greed/materialism. Just say what Paul said.`;

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
      // Fallback: check Stripe directly and self-heal the DB
      let stripeGranted = false;
      try {
        if (process.env.STRIPE_SECRET_KEY && authUser.email) {
          const { getStripe } = await import("@/lib/stripe");
          const stripe = getStripe();
          const customers = await stripe.customers.list({ email: authUser.email, limit: 5 });
          for (const customer of customers.data) {
            const subs = await stripe.subscriptions.list({ customer: customer.id, status: "active", limit: 10 });
            for (const sub of subs.data) {
              const meta = sub.metadata || {};
              const pt = meta.product_type || "";
              let dbType: string;
              if (pt === "premium_annual" || pt === "premium_monthly") dbType = "premium_yearly";
              else if (pt === "explain_monthly") dbType = "explain_monthly";
              else {
                const amount = sub.items?.data?.[0]?.price?.unit_amount;
                if (amount === 7900 || amount === 999) dbType = "premium_yearly";
                else if (amount === 499) dbType = "explain_monthly";
                else dbType = "premium_yearly";
              }
              if (dbType === "premium_yearly" || dbType === "explain_monthly") {
                stripeGranted = true;
                // Self-heal: write to DB
                const firstItem = sub.items?.data?.[0];
                const periodStart = new Date((firstItem?.current_period_start ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();
                const periodEnd = new Date((firstItem?.current_period_end ?? Math.floor(Date.now() / 1000) + 86400 * 365) * 1000).toISOString();
                await supabase.from("subscriptions").upsert({
                  user_id: authUser.id,
                  type: dbType,
                  stripe_subscription_id: sub.id,
                  stripe_customer_id: customer.id,
                  status: "active",
                  current_period_start: periodStart,
                  current_period_end: periodEnd,
                  updated_at: new Date().toISOString(),
                }, { onConflict: "user_id,type" });
                console.log(`[explain-verse] Self-healed: wrote ${dbType} for user ${authUser.id}`);
                break;
              }
            }
            if (stripeGranted) break;
          }
        }
      } catch (e) {
        console.error("[explain-verse] Stripe fallback error:", e);
      }

      if (!stripeGranted) {
        return NextResponse.json(
          { error: "Explain subscription required", code: "SUBSCRIPTION_REQUIRED" },
          { status: 403 }
        );
      }
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
