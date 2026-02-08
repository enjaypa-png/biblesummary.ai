/**
 * Seed Bible Book Summaries
 *
 * This script reads markdown summary files from content/summaries/
 * and upserts them into the Supabase summaries table.
 *
 * Run with: npm run seed:summaries
 *
 * Requirements:
 * - Books must be seeded first (run seed:books)
 * - SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
 * - Summary files in content/summaries/ with format: {order}-{slug}.md
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing environment variables');
  console.error('Required:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const SUMMARIES_DIR = path.join(process.cwd(), 'content', 'summaries');

async function seedSummaries() {
  console.log('📝 Seeding Bible book summaries...\n');

  try {
    // Get all books from database
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, slug, name, order_index')
      .order('order_index');

    if (booksError) throw new Error(`Failed to fetch books: ${booksError.message}`);
    if (!books || books.length === 0) {
      throw new Error('No books found in database. Run seed:books first.');
    }

    console.log(`Found ${books.length} books in database\n`);

    // Read all summary markdown files
    const files = fs.readdirSync(SUMMARIES_DIR)
      .filter(f => f.endsWith('.md') && f !== 'SUMMARY-GUIDE.md')
      .sort();

    if (files.length === 0) {
      console.log('No summary files found in content/summaries/');
      process.exit(0);
    }

    console.log(`Found ${files.length} summary files\n`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const file of files) {
      // Extract slug from filename: "01-genesis.md" -> "genesis", "60-1-peter.md" -> "1-peter"
      const slug = file.replace(/^\d+-/, '').replace(/\.md$/, '');

      // Find matching book
      const book = books.find(b => b.slug === slug);
      if (!book) {
        console.log(`   ⚠️  No matching book for file: ${file} (slug: ${slug})`);
        skipped++;
        continue;
      }

      // Read the markdown content
      const filePath = path.join(SUMMARIES_DIR, file);
      const summaryText = fs.readFileSync(filePath, 'utf-8').trim();

      if (!summaryText) {
        console.log(`   ⚠️  Empty file: ${file}`);
        skipped++;
        continue;
      }

      // Check if summary already exists for this book
      const { data: existing } = await supabase
        .from('summaries')
        .select('id')
        .eq('book_id', book.id)
        .single();

      if (existing) {
        // Update existing summary
        const { error: updateError } = await supabase
          .from('summaries')
          .update({ summary_text: summaryText, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`   ❌ Failed to update ${book.name}: ${updateError.message}`);
          continue;
        }

        console.log(`   🔄 Updated: ${book.name}`);
        updated++;
      } else {
        // Insert new summary
        const { error: insertError } = await supabase
          .from('summaries')
          .insert({ book_id: book.id, summary_text: summaryText });

        if (insertError) {
          console.error(`   ❌ Failed to insert ${book.name}: ${insertError.message}`);
          continue;
        }

        console.log(`   ✅ Inserted: ${book.name}`);
        inserted++;
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Updated:  ${updated}`);
    console.log(`   Skipped:  ${skipped}`);

    // Verify total
    const { count, error: countError } = await supabase
      .from('summaries')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`\n   Total summaries in database: ${count}`);
    }

    console.log('\n🎉 Summary seeding complete!');

  } catch (error) {
    console.error('\n❌ Error seeding summaries:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

seedSummaries();
