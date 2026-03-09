/**
 * Backfill WEB text into existing CT JSON files
 *
 * Many CT JSON files were generated before the WEB field was added.
 * This script fetches WEB text from GitHub and merges it into
 * every CT JSON file that is missing the "web" field.
 *
 * Usage:
 *   npx tsx scripts/backfill-web.ts              # Backfill all books
 *   npx tsx scripts/backfill-web.ts --book genesis  # One book only
 *   npx tsx scripts/backfill-web.ts --dry-run    # Preview without writing
 */

import * as fs from 'fs';
import * as path from 'path';
import { fetchWEBBook } from './fetch-web';

const CT_DIR = path.join(process.cwd(), 'data', 'translations', 'ct');

function parseArgs() {
  const args = process.argv.slice(2);
  let book: string | null = null;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--book' && args[i + 1]) {
      book = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { book, dryRun };
}

async function main() {
  const { book: bookFilter, dryRun } = parseArgs();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Backfill WEB text into CT JSON files');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (dryRun) console.log('  Mode: DRY RUN (no files modified)');
  if (bookFilter) console.log(`  Book filter: ${bookFilter}`);
  console.log('');

  let bookDirs = fs.readdirSync(CT_DIR)
    .filter((d) => fs.statSync(path.join(CT_DIR, d)).isDirectory())
    .sort();

  if (bookFilter) {
    bookDirs = bookDirs.filter((d) => d === bookFilter);
    if (bookDirs.length === 0) {
      console.error(`No CT directory found for "${bookFilter}"`);
      process.exit(1);
    }
  }

  let totalUpdated = 0;
  let totalVersesAdded = 0;
  let totalAlreadyHadWeb = 0;
  let totalMissing = 0;
  let totalSkipped = 0;

  for (const bookSlug of bookDirs) {
    let webChapters: Map<number, { verse: number; text: string }[]>;
    try {
      webChapters = await fetchWEBBook(bookSlug);
    } catch (err: any) {
      console.warn(`   ⚠ ${bookSlug}: Failed to fetch WEB data (${err.message})`);
      console.warn(`     Make sure you have internet access. WEB data is fetched from GitHub.`);
      continue;
    }

    const bookDir = path.join(CT_DIR, bookSlug);
    const chapterFiles = fs.readdirSync(bookDir)
      .filter((f) => f.endsWith('.json'))
      .sort((a, b) => parseInt(a) - parseInt(b));

    let bookVersesAdded = 0;
    let bookFilesUpdated = 0;

    for (const file of chapterFiles) {
      const filePath = path.join(bookDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const chapterNum = data.chapter as number;

      const webVerses = webChapters.get(chapterNum);
      if (!webVerses) {
        totalMissing++;
        continue;
      }

      const webMap = new Map(webVerses.map((v) => [v.verse, v.text]));

      let modified = false;
      let versesAdded = 0;
      let alreadyHad = 0;

      for (const v of data.verses) {
        if (v.web && v.web.trim().length > 0) {
          alreadyHad++;
          continue;
        }

        const webText = webMap.get(v.verse);
        if (webText) {
          v.web = webText;
          modified = true;
          versesAdded++;
        }
      }

      totalAlreadyHadWeb += alreadyHad;

      if (modified) {
        if (!dryRun) {
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
        }
        bookVersesAdded += versesAdded;
        bookFilesUpdated++;
        totalUpdated++;
        totalVersesAdded += versesAdded;
      } else {
        totalSkipped++;
      }
    }

    if (bookVersesAdded > 0) {
      console.log(`   ${bookSlug}: +${bookVersesAdded} WEB verses across ${bookFilesUpdated} chapters`);
    } else {
      console.log(`   ${bookSlug}: already complete`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ${dryRun ? '[DRY RUN] Would update' : 'Updated'}: ${totalUpdated} chapter files`);
  console.log(`  WEB verses added: ${totalVersesAdded}`);
  console.log(`  Already had WEB: ${totalAlreadyHadWeb}`);
  if (totalMissing > 0) console.log(`  Chapters with no WEB source: ${totalMissing}`);
  if (totalSkipped > 0) console.log(`  Files unchanged: ${totalSkipped}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main();
