// src/config/supabase.js

import { createClient } from "@supabase/supabase-js";

/**
 * Supabase project configuration
 * NOTE:
 * - anon key is safe to expose in frontend
 * - NEVER put service_role key here
 */
const SUPABASE_URL = "https://ugllcdapuzihpkgcoaxj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbGxjZGFwdXppaHBrZ2NvYXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTA3NzksImV4cCI6MjA4NjA2Njc3OX0.73I1cW1fqRUha5_6spK7C8m-SXUHQQfyjmcbNNbdfCI";

/**
 * Create a single Supabase client for the entire app
 * - Should be imported everywhere
 * - NEVER recreate inside components
 */
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

/**
 * Helper: get current authenticated user
 * (safe wrapper so you don't repeat this everywhere)
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user || null;
}

/**
 * Helper: check if user is logged in
 */
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return Boolean(user);
}
