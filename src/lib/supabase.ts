import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// DSE Portal Supabase — read-only access to live stock data
const dseUrl = import.meta.env.VITE_DSE_SUPABASE_URL;
const dseKey = import.meta.env.VITE_DSE_SUPABASE_ANON_KEY;

export const dseSupabase = dseUrl && dseKey
  ? createClient(dseUrl, dseKey)
  : null;
