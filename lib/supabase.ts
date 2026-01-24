import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client configuration
 *
 * This file creates a Supabase client for interacting with your Supabase database and auth.
 * Make sure to set the environment variables in your .env.local file:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous/public key
 */

// Get Supabase URL and anonymous key from environment variables
// Use placeholder values during build if env vars are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

/**
 * Create and export the Supabase client
 * This client can be used throughout your application for:
 * - Authentication (sign up, sign in, sign out)
 * - Database queries
 * - Real-time subscriptions
 * - Storage operations
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper function to get the current user
 * Returns null if no user is signed in
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Helper function to sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
}
