import { createClient } from '@supabase/supabase-js';

// Reads from .env file during local development, or Vercel environment variables in production
export const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
export const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

// Create the real Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function saveSupabaseConfig(url: string, key: string) {
  // Config UI is removed, so this is just a no-op fallback
  return;
}
