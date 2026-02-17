/**
 * Clear Translation (CT) Progress Report
 *
 * Shows how many chapters have been generated for each book,
 * what percentage of the Bible is complete, and what's left.
 *
 * Usage:
 *   npm run ct:progress
 */

import * as fs from 'fs';
import * as path from 'path';

const CT_DIR = path.join(process.cwd(), 'data', 'translations', 'ct');
const BOOKS_PATH = path.join(process.cwd(), 'data', 'books.json');

interface Book {
  name: string;
  slug: string;
  order_index: number;
  testament: string;
  total_chapters: number;
}

function main() {
  const books: Book[] = JSON.parse(fs.readFileSync(BOOKS_PATH, 'utf-8'));

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Clear Translation (CT) — Progress Report');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let totalChapters = 0;
  let completedChapters = 0;
  let totalVerses = 0;

  const results: {
    name: string;
    testament: string;
    done: number;
    total: number;
    verses: number;
  }[] = [];

  for (const book of books) {
    totalChapters += book.total_chapters;
    const bookDir = path.join(CT_DIR, book.slug);

    let done = 0;
    let bookVerses = 0;

    if (fs.existsSync(bookDir)) {
      const files = fs.readdirSync(bookDir).filter((f) => f.endsWith('.json'));
      done = files.length;

      // Count verses in completed chapters
      for (const file of files) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(bookDir, file), 'utf-8'));
          bookVerses += data.verses?.length || 0;
        } catch {
          // Skip malformed files
        }
      }
    }

    completedChapters += done;
    totalVerses += bookVerses;

    results.push({
      name: book.name,
      testament: book.testament,
      done,
      total: book.total_chapters,
      verses: bookVerses
    });
  }

  // Print Old Testament
  console.log('  OLD TESTAMENT');
  console.log('  ─────────────────────────────────────────────────');
  for (const r of results.filter((r) => r.testament === 'Old')) {
    const pct = r.total > 0 ? Math.round((r.done / r.total) * 100) : 0;
    const bar = makeBar(r.done, r.total);
    const status = r.done === r.total ? '✅' : r.done > 0 ? '🔄' : '  ';
    console.log(`  ${status} ${r.name.padEnd(18)} ${bar} ${r.done}/${r.total} chapters (${pct}%)`);
  }

  console.log('');
  console.log('  NEW TESTAMENT');
  console.log('  ─────────────────────────────────────────────────');
  for (const r of results.filter((r) => r.testament === 'New')) {
    const pct = r.total > 0 ? Math.round((r.done / r.total) * 100) : 0;
    const bar = makeBar(r.done, r.total);
    const status = r.done === r.total ? '✅' : r.done > 0 ? '🔄' : '  ';
    console.log(`  ${status} ${r.name.padEnd(18)} ${bar} ${r.done}/${r.total} chapters (${pct}%)`);
  }

  const overallPct = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Overall: ${completedChapters}/${totalChapters} chapters (${overallPct}%)`);
  console.log(`  Verses generated: ${totalVerses}`);
  console.log(`  Chapters remaining: ${totalChapters - completedChapters}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

function makeBar(done: number, total: number): string {
  const width = 20;
  const filled = total > 0 ? Math.round((done / total) * width) : 0;
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + ']';
}

main();
