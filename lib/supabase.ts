import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback to a valid-format placeholder so createClient doesn't throw on startup.
// Actual requests will fail with auth errors, which we handle gracefully.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-key';

// ─── Browser client (for client components) ──────────────────
export function createBrowserClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY;
  return createClient(supabaseUrl, supabaseAnonKey);
}

// ─── Server client with service role (for API routes) ────────
export function createServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// ─── Singleton browser client for reuse ──────────────────────
let browserClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
}
