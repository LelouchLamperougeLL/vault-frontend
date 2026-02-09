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

// Custom lists sync
export const syncCustomLists = async (lists: any[], userId: string) => {
  const { error } = await supabase
    .from('custom_lists')
    .upsert(
      lists.map((list) => ({
        user_id: userId,
        list_id: list.id,
        list_data: list,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'user_id,list_id' }
    );

  if (error) {
    console.error('Custom lists sync failed:', error);
    throw error;
  }
};

export const fetchCustomLists = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('custom_lists')
    .select('list_data')
    .eq('user_id', userId);

  if (error) {
    console.error('Fetch custom lists failed:', error);
    throw error;
  }

  return data?.map((row) => row.list_data) || [];
};

// Activity feed
export const addActivity = async (activity: any, userId: string) => {
  const { error } = await supabase.from('activities').insert({
    user_id: userId,
    activity_data: activity,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Add activity failed:', error);
  }
};

export const fetchActivities = async (userId: string, limit: number = 50): Promise<any[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('activity_data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Fetch activities failed:', error);
    return [];
  }

  return data?.map((row) => row.activity_data) || [];
};

// Auth functions
export const signUp = async (email: string, password: string, username?: string) => {
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: { username }
    }
  });
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

export const updateProfile = async (_userId: string, updates: { username?: string; avatar?: string }) => {
  const { error } = await supabase.auth.updateUser({
    data: updates
  });
  if (error) throw error;
};

// Real-time subscriptions
export const subscribeToVault = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('vault_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vault_items',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};
