export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import BibleIndex from "./BibleIndex";

interface Book {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  testament: string;
  total_chapters: number;
}

function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
}

async function getBooks(): Promise<Book[]> {
  const supabase = createSupabaseServer();

  const { data, error } = await supabase
    .from("books")
    .select("id, name, slug, order_index, testament, total_chapters")
    .order("order_index");

  if (error || !data) return [];
  return data;
}

export default async function BiblePage() {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const books = await getBooks();

  return <BibleIndex books={books} />;
}

export const metadata = {
  title: "Bible Index - BibleSummary.ai",
  description: "Navigate the King James Version Holy Bible. Browse books, chapters, and verses.",
};
