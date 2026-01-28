-- ============================================================================
-- Seed Books Data
-- ============================================================================
-- This file inserts all 66 books of the Bible into the books table
-- Run this in Supabase SQL Editor after running migrations
-- ============================================================================

INSERT INTO books (name, slug, order_index, testament, total_chapters) VALUES
  ('Genesis', 'genesis', 1, 'Old', 50),
  ('Exodus', 'exodus', 2, 'Old', 40),
  ('Leviticus', 'leviticus', 3, 'Old', 27),
  ('Numbers', 'numbers', 4, 'Old', 36),
  ('Deuteronomy', 'deuteronomy', 5, 'Old', 34),
  ('Joshua', 'joshua', 6, 'Old', 24),
  ('Judges', 'judges', 7, 'Old', 21),
  ('Ruth', 'ruth', 8, 'Old', 4),
  ('1 Samuel', '1-samuel', 9, 'Old', 31),
  ('2 Samuel', '2-samuel', 10, 'Old', 24),
  ('1 Kings', '1-kings', 11, 'Old', 22),
  ('2 Kings', '2-kings', 12, 'Old', 25),
  ('1 Chronicles', '1-chronicles', 13, 'Old', 29),
  ('2 Chronicles', '2-chronicles', 14, 'Old', 36),
  ('Ezra', 'ezra', 15, 'Old', 10),
  ('Nehemiah', 'nehemiah', 16, 'Old', 13),
  ('Esther', 'esther', 17, 'Old', 10),
  ('Job', 'job', 18, 'Old', 42),
  ('Psalms', 'psalms', 19, 'Old', 150),
  ('Proverbs', 'proverbs', 20, 'Old', 31),
  ('Ecclesiastes', 'ecclesiastes', 21, 'Old', 12),
  ('Song of Solomon', 'song-of-solomon', 22, 'Old', 8),
  ('Isaiah', 'isaiah', 23, 'Old', 66),
  ('Jeremiah', 'jeremiah', 24, 'Old', 52),
  ('Lamentations', 'lamentations', 25, 'Old', 5),
  ('Ezekiel', 'ezekiel', 26, 'Old', 48),
  ('Daniel', 'daniel', 27, 'Old', 12),
  ('Hosea', 'hosea', 28, 'Old', 14),
  ('Joel', 'joel', 29, 'Old', 3),
  ('Amos', 'amos', 30, 'Old', 9),
  ('Obadiah', 'obadiah', 31, 'Old', 1),
  ('Jonah', 'jonah', 32, 'Old', 4),
  ('Micah', 'micah', 33, 'Old', 7),
  ('Nahum', 'nahum', 34, 'Old', 3),
  ('Habakkuk', 'habakkuk', 35, 'Old', 3),
  ('Zephaniah', 'zephaniah', 36, 'Old', 3),
  ('Haggai', 'haggai', 37, 'Old', 2),
  ('Zechariah', 'zechariah', 38, 'Old', 14),
  ('Malachi', 'malachi', 39, 'Old', 4),
  ('Matthew', 'matthew', 40, 'New', 28),
  ('Mark', 'mark', 41, 'New', 16),
  ('Luke', 'luke', 42, 'New', 24),
  ('John', 'john', 43, 'New', 21),
  ('Acts', 'acts', 44, 'New', 28),
  ('Romans', 'romans', 45, 'New', 16),
  ('1 Corinthians', '1-corinthians', 46, 'New', 16),
  ('2 Corinthians', '2-corinthians', 47, 'New', 13),
  ('Galatians', 'galatians', 48, 'New', 6),
  ('Ephesians', 'ephesians', 49, 'New', 6),
  ('Philippians', 'philippians', 50, 'New', 4),
  ('Colossians', 'colossians', 51, 'New', 4),
  ('1 Thessalonians', '1-thessalonians', 52, 'New', 5),
  ('2 Thessalonians', '2-thessalonians', 53, 'New', 3),
  ('1 Timothy', '1-timothy', 54, 'New', 6),
  ('2 Timothy', '2-timothy', 55, 'New', 4),
  ('Titus', 'titus', 56, 'New', 3),
  ('Philemon', 'philemon', 57, 'New', 1),
  ('Hebrews', 'hebrews', 58, 'New', 13),
  ('James', 'james', 59, 'New', 5),
  ('1 Peter', '1-peter', 60, 'New', 5),
  ('2 Peter', '2-peter', 61, 'New', 3),
  ('1 John', '1-john', 62, 'New', 5),
  ('2 John', '2-john', 63, 'New', 1),
  ('3 John', '3-john', 64, 'New', 1),
  ('Jude', 'jude', 65, 'New', 1),
  ('Revelation', 'revelation', 66, 'New', 22);

-- Verify the insert
SELECT
  testament,
  COUNT(*) as book_count,
  SUM(total_chapters) as chapter_count
FROM books
GROUP BY testament
ORDER BY MIN(order_index);

-- Expected results:
-- Old Testament: 39 books, 929 chapters
-- New Testament: 27 books, 260 chapters
-- Total: 66 books, 1,189 chapters
