import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://ugllcdapuzihpkgcoaxj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbGxjZGFwdXppaHBrZ2NvYXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTA3NzksImV4cCI6MjA4NjA2Njc3OX0.73I1cW1fqRUha5_6spK7C8m-SXUHQQfyjmcbNNbdfCI';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin IDs for privileged operations
export const ADMIN_IDS = ['74e5b3ea-113f-4d6c-be2a-b0b52b2e92c3'];

// Check if user is admin
export const isAdmin = (userId: string | undefined): boolean => {
  if (!userId) return false;
  return ADMIN_IDS.includes(userId);
};

// Database types
export interface VaultItemDB {
  id?: string;
  user_id: string;
  imdb_id: string;
  item_data: any;
  updated_at: string;
}

// Cloud sync functions
export const syncToCloud = async (items: Record<string, any>, userId: string) => {
  const batch = Object.entries(items).map(([imdbId, item]) => ({
    user_id: userId,
    imdb_id: imdbId,
    item_data: item,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('vault_items')
    .upsert(batch, { onConflict: 'user_id,imdb_id' });

  if (error) {
    console.error('Cloud sync failed:', error);
    throw error;
  }
};

export const fetchFromCloud = async (userId: string): Promise<Record<string, any>> => {
  const { data, error } = await supabase
    .from('vault_items')
    .select('imdb_id, item_data')
    .eq('user_id', userId);

  if (error) {
    console.error('Fetch from cloud failed:', error);
    throw error;
  }

  const result: Record<string, any> = {};
  data?.forEach((row) => {
    result[row.imdb_id] = row.item_data;
  });

  return result;
};

// Auth functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};
