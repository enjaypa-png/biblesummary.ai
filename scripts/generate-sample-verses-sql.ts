/**
 * Generate Sample Verses SQL
 *
 * Creates a SQL file with Genesis 1 and John 3 for testing
 */

import * as fs from 'fs';
import * as path from 'path';

interface Verse {
  verse: string;
  text: string;
}

interface Chapter {
  chapter: string;
  verses: Verse[];
}

interface BookData {
  book: string;
  chapters: Chapter[];
}

function escapeSQL(text: string): string {
  return text.replace(/'/g, "''");
}

async function generateSampleSQL() {
  console.log('📝 Generating sample verses SQL...\n');

  try {
    // Read Genesis and John JSON files
    const genesisData: BookData = JSON.parse(
      fs.readFileSync('/tmp/genesis.json', 'utf-8')
    );
    const johnData: BookData = JSON.parse(
      fs.readFileSync('/tmp/john.json', 'utf-8')
    );

    let sql = `-- ============================================================================
-- Sample Bible Verses for Testing
-- ============================================================================
-- Genesis Chapter 1 (31 verses)
-- John Chapter 3 (36 verses)
-- Total: 67 verses for testing the app
-- ============================================================================

`;

    // Genesis Chapter 1
    const genesisChapter1 = genesisData.chapters[0]; // First chapter
    sql += `-- Genesis Chapter 1\n`;
    sql += `INSERT INTO verses (book_id, chapter, verse, text) VALUES\n`;

    const gen1Verses = genesisChapter1.verses.map((v, idx) => {
      const isLast = idx === genesisChapter1.verses.length - 1;
      return `  ((SELECT id FROM books WHERE slug = 'genesis'), 1, ${v.verse}, '${escapeSQL(v.text)}')${isLast ? ';' : ','}`;
    }).join('\n');

    sql += gen1Verses + '\n\n';

    // John Chapter 3
    const johnChapter3 = johnData.chapters[2]; // Third chapter (index 2)
    sql += `-- John Chapter 3\n`;
    sql += `INSERT INTO verses (book_id, chapter, verse, text) VALUES\n`;

    const john3Verses = johnChapter3.verses.map((v, idx) => {
      const isLast = idx === johnChapter3.verses.length - 1;
      return `  ((SELECT id FROM books WHERE slug = 'john'), 3, ${v.verse}, '${escapeSQL(v.text)}')${isLast ? ';' : ','}`;
    }).join('\n');

    sql += john3Verses + '\n\n';

    // Add verification query
    sql += `-- Verify insertion\n`;
    sql += `SELECT
  b.name,
  v.chapter,
  COUNT(*) as verse_count
FROM verses v
JOIN books b ON b.id = v.book_id
GROUP BY b.name, v.chapter
ORDER BY b.order_index, v.chapter;\n\n`;

    sql += `-- Expected results:\n`;
    sql += `-- Genesis, Chapter 1: 31 verses\n`;
    sql += `-- John, Chapter 3: 36 verses\n`;

    // Write to file
    const outputPath = path.join(process.cwd(), 'supabase', 'seeds', '002_seed_sample_verses.sql');
    fs.writeFileSync(outputPath, sql, 'utf-8');

    console.log(`✅ Sample SQL generated: supabase/seeds/002_seed_sample_verses.sql`);
    console.log(`   - Genesis 1: ${genesisChapter1.verses.length} verses`);
    console.log(`   - John 3: ${johnChapter3.verses.length} verses`);
    console.log(`   - Total: ${genesisChapter1.verses.length + johnChapter3.verses.length} verses\n`);
    console.log('🎉 Ready to paste into Supabase SQL Editor!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateSampleSQL();
