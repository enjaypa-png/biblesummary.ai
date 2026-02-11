export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import SummariesPageClient from "./SummariesPageClient";

interface BookWithSummary {
  id: string;
  name: string;
  slug: string;
  testament: string;
  order_index: number;
}

async function getBooksWithSummaries(): Promise<BookWithSummary[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("summaries")
    .select("book_id, books(id, name, slug, testament, order_index)");

  if (error) return [];

  const books: BookWithSummary[] = [];
  for (const row of data || []) {
    const booksData = (row as { books: BookWithSummary | BookWithSummary[] | null }).books;
    const book = Array.isArray(booksData) ? booksData[0] : booksData;
    if (book) books.push(book);
  }
  return books.sort((a, b) => a.order_index - b.order_index);
}

export default async function SummariesLibraryPage() {
  const books = await getBooksWithSummaries();
  return <SummariesPageClient books={books} />;
}

export const metadata = {
  title: "Book Summaries - BibleSummary.ai",
  description: "Neutral book summaries for every book of the Bible.",
};
