/**
 * Seed Modern English Text into Supabase
 * 
 * This script reads the JSON output from modernize-kjv.ts and updates
 * the "modern_text" column in the verses table.
 * 
 * PREREQUISITES:
 * 1. Run the SQL migration: supabase/migrations/20260216_add_modern_text.sql
 * 2. Run modernize-kjv.ts to generate the JSON files
 * 
 * USAGE:
 *   npm run seed:modern                  # Seed all available books
 *   npm run seed:modern -- --book genesis  # Seed a single book
 *   npm run seed:modern -- --dry-run      # Preview without writing to DB
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const OUTPUT_DIR = path.join(process.cwd(), 'scripts', 'modern-output');

// Parse args
const args = process.argv.slice(2);
const bookFilter = args.find(a => a.startsWith('--book='))?.split('=')[1]
  || (args.indexOf('--book') !== -1 ? args[args.indexOf('--book') + 1] : null);
const dryRun = args.includes('--dry-run');

interface ModernVerse {
  verse: number;
  text: string;
}

async function seedModernText() {
  console.log('📖 Seeding Modern English text into Supabase\n');
  
  if (dryRun) {
    console.log('   🔍 DRY RUN MODE - no database writes\n');
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    console.error(`❌ Output directory not found: ${OUTPUT_DIR}`);
    console.error('   Run "npm run modernize" first to generate the modernized text.');
    process.exit(1);
  }

  // Get all books from database
  let booksQuery = supabase.from('books').select('id, name, slug, total_chapters').order('order_index');
  if (bookFilter) {
    booksQuery = booksQuery.eq('slug', bookFilter);
  }

  const { data: books, error: booksError } = await booksQuery;
  if (booksError || !books || books.length === 0) {
    console.error('❌ Failed to fetch books from database');
    process.exit(1);
  }

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const book of books) {
    const bookDir = path.join(OUTPUT_DIR, book.slug);
    
    if (!fs.existsSync(bookDir)) {
      console.log(`   ⏭️  ${book.name}: No modernized output found, skipping`);
      continue;
    }

    console.log(`\n📘 ${book.name}`);

    for (let chapter = 1; chapter <= book.total_chapters; chapter++) {
      const chapterFile = path.join(bookDir, `chapter_${chapter}.json`);
      
      if (!fs.existsSync(chapterFile)) {
        totalSkipped++;
        continue;
      }

      try {
        // Read the modernized verses
        const modernVerses: ModernVerse[] = JSON.parse(
          fs.readFileSync(chapterFile, 'utf-8')
        );

        if (dryRun) {
          console.log(`   Ch ${chapter}: ${modernVerses.length} verses (dry run)`);
          totalUpdated += modernVerses.length;
          continue;
        }

        // Get existing verse IDs for this chapter
        const { data: existingVerses, error: fetchError } = await supabase
          .from('verses')
          .select('id, verse')
          .eq('book_id', book.id)
          .eq('chapter', chapter)
          .order('verse');

        if (fetchError || !existingVerses) {
          console.error(`   ❌ Ch ${chapter}: Failed to fetch existing verses`);
          totalErrors++;
          continue;
        }

        // Create a map of verse number → ID for fast lookup
        const verseIdMap = new Map<number, string>();
        for (const v of existingVerses) {
          verseIdMap.set(v.verse, v.id);
        }

        // Update each verse with modern text
        let chapterUpdated = 0;
        for (const mv of modernVerses) {
          const verseId = verseIdMap.get(mv.verse);
          if (!verseId) {
            console.warn(`     ⚠️  Verse ${mv.verse} not found in DB, skipping`);
            continue;
          }

          const { error: updateError } = await supabase
            .from('verses')
            .update({ modern_text: mv.text })
            .eq('id', verseId);

          if (updateError) {
            console.error(`     ❌ Failed to update verse ${mv.verse}: ${updateError.message}`);
            totalErrors++;
          } else {
            chapterUpdated++;
          }
        }

        totalUpdated += chapterUpdated;
        console.log(`   ✅ Ch ${chapter}: ${chapterUpdated} verses updated`);

      } catch (error: any) {
        console.error(`   ❌ Ch ${chapter}: ${error.message}`);
        totalErrors++;
      }
    }

    // Small delay between books
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 SEEDING COMPLETE');
  console.log('='.repeat(50));
  console.log(`   Updated:  ${totalUpdated} verses`);
  console.log(`   Skipped:  ${totalSkipped} chapters (no output file)`);
  console.log(`   Errors:   ${totalErrors}`);
  
  if (dryRun) {
    console.log('\n   This was a dry run. Run without --dry-run to write to database.');
  }
  
  console.log('');
}

seedModernText().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
