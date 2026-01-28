/**
 * Seed Books Data
 *
 * This script loads all 66 books of the Bible into the Supabase database.
 * Run with: npm run seed:books
 *
 * Requirements:
 * - SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
 * - Database migrations must be run first
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing environment variables');
  console.error('Required:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
// Service role bypasses RLS, allowing us to insert data
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Book {
  name: string;
  slug: string;
  order_index: number;
  testament: 'Old' | 'New';
  total_chapters: number;
}

async function seedBooks() {
  console.log('📖 Seeding Bible books...\n');

  try {
    // Read books data
    const booksPath = path.join(process.cwd(), 'data', 'books.json');
    const booksData = fs.readFileSync(booksPath, 'utf-8');
    const books: Book[] = JSON.parse(booksData);

    console.log(`Found ${books.length} books to insert\n`);

    // Check if books already exist
    const { data: existingBooks, error: checkError } = await supabase
      .from('books')
      .select('name')
      .limit(1);

    if (checkError) {
      throw new Error(`Database check failed: ${checkError.message}`);
    }

    if (existingBooks && existingBooks.length > 0) {
      console.log('⚠️  Books table already has data');
      console.log('   To re-seed, delete existing books first:');
      console.log('   DELETE FROM books;');
      console.log('\n   Or continue to skip insertion\n');

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise<string>((resolve) => {
        readline.question('Continue anyway? (y/N): ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() !== 'y') {
        console.log('Aborted.');
        process.exit(0);
      }
    }

    // Insert books
    const { data, error } = await supabase
      .from('books')
      .insert(books)
      .select();

    if (error) {
      throw new Error(`Insert failed: ${error.message}`);
    }

    console.log('✅ Successfully inserted books:\n');

    // Show summary
    const oldTestament = books.filter(b => b.testament === 'Old');
    const newTestament = books.filter(b => b.testament === 'New');

    console.log(`   Old Testament: ${oldTestament.length} books`);
    console.log(`   New Testament: ${newTestament.length} books`);
    console.log(`   Total: ${books.length} books\n`);

    // Verify insertion
    const { count, error: countError } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.warn('⚠️  Could not verify count:', countError.message);
    } else {
      console.log(`📊 Database now contains ${count} books\n`);
    }

    console.log('🎉 Books seeding complete!');

  } catch (error) {
    console.error('❌ Error seeding books:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the seed function
seedBooks();
