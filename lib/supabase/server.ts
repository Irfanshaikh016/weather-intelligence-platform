import { createClient } from '@supabase/supabase-js';

function getCleanUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return raw.trim().replace(/\/+$/, '');
}

function getCleanKey(): string {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return raw.trim();
}

export function isServerSupabaseConfigured(): boolean {
  const url = getCleanUrl();
  const key = getCleanKey();
  if (!url || !key) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Create server-side client with administrative service role permissions
export function createServerSupabaseClient() {
  const url = getCleanUrl();
  const key = getCleanKey();

  if (!url || !key) {
    return null;
  }

  try {
    new URL(url);
  } catch {
    console.warn('[Supabase Server] Malformed NEXT_PUBLIC_SUPABASE_URL:', url);
    return null;
  }

  try {
    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (err) {
    console.warn('[Supabase Server] Error initializing client:', err);
    return null;
  }
}
