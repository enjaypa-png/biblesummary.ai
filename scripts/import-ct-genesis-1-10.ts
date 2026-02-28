/**
 * One-off: Import Genesis 1-10 CT from parsed docx text.
 * Replaces CT for Genesis 1-10 only; keeps KJV from existing files.
 */

import * as fs from 'fs';
import * as path from 'path';

const CT_DIR = path.join(process.cwd(), 'data', 'translations', 'ct');
const RAW_TEXT = fs.readFileSync('/tmp/ct_genesis_1_10.txt', 'utf-8');

function parseDocxText(raw: string): Map<number, { verse: number; text: string }[]> {
  const chapters = new Map<number, { verse: number; text: string }[]>();
  const blocks = raw.split(/Genesis Chapter \d+ — Clear Translation/);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].trim();
    const firstLine = block.split('\n')[0];
    const chapterMatch = firstLine.match(/^(\d+)/);
    if (!chapterMatch) continue;
    const chapter = parseInt(chapterMatch[1], 10);
    const rest = block.slice(firstLine.length).trim();
    const verses: { verse: number; text: string }[] = [];
    for (const line of rest.split('\n')) {
      const m = line.match(/^(\d+)\.\s+(.*)$/s);
      if (m) {
        verses.push({ verse: parseInt(m[1], 10), text: m[2].trim() });
      }
    }
    chapters.set(chapter, verses);
  }
  return chapters;
}

// Fix: chapter header "Genesis Chapter 3" - our split loses the number. Re-parse.
function parseCorrect(raw: string): Map<number, { verse: number; text: string }[]> {
  const chapters = new Map<number, { verse: number; text: string }[]>();
  const regex = /Genesis Chapter (\d+) — Clear Translation\s*\n([\s\S]*?)(?=Genesis Chapter \d+ — Clear Translation|$)/g;
  let m;
  while ((m = regex.exec(raw)) !== null) {
    const chapter = parseInt(m[1], 10);
    const block = m[2].trim();
    const verses: { verse: number; text: string }[] = [];
    for (const line of block.split('\n')) {
      const vm = line.match(/^(\d+)\.\s+(.*)$/s);
      if (vm) {
        verses.push({ verse: parseInt(vm[1], 10), text: vm[2].trim() });
      }
    }
    chapters.set(chapter, verses);
  }
  return chapters;
}

async function main() {
  const ctByChapter = parseCorrect(RAW_TEXT);
  const genesisDir = path.join(CT_DIR, 'genesis');
  if (!fs.existsSync(genesisDir)) fs.mkdirSync(genesisDir, { recursive: true });

  for (let ch = 1; ch <= 10; ch++) {
    const existingPath = path.join(genesisDir, `${ch}.json`);
    const existing = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
    const newCtVerses = ctByChapter.get(ch);
    if (!newCtVerses || newCtVerses.length === 0) {
      console.warn(`No CT verses for chapter ${ch}, skipping`);
      continue;
    }
    const ctMap = new Map(newCtVerses.map((v) => [v.verse, v.text]));
    const verses = existing.verses.map((v: { verse: number; kjv: string; ct: string }) => ({
      verse: v.verse,
      kjv: v.kjv,
      ct: ctMap.get(v.verse) ?? v.ct,
    }));
    const output = {
      book: 'genesis',
      book_name: 'Genesis',
      chapter: ch,
      translation: 'ct',
      generated_at: new Date().toISOString(),
      model: 'claude-opus-4-6',
      verses,
    };
    fs.writeFileSync(existingPath, JSON.stringify(output, null, 2));
    console.log(`Updated Genesis ${ch} (${verses.length} verses)`);
  }
  console.log('Done. Run: npm run ct:seed -- --book genesis');
}

main().catch(console.error);
