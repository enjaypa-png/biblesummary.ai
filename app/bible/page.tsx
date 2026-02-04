export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import BibleIndex from "./BibleIndex";

interface Book {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  testament: string;
  total_chapters: number;
}

async function getBooks(): Promise<Book[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("books")
    .select("id, name, slug, order_index, testament, total_chapters")
    .order("order_index");

  if (error || !data) return [];
  return data;
}

export default async function BiblePage() {
  const books = await getBooks();

  return <BibleIndex books={books} />;
}

export const metadata = {
  title: "Bible Index - BibleSummary.ai",
  description: "Navigate the King James Version Holy Bible. Browse books, chapters, and verses.",
};
