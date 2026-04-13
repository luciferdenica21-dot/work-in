import { createClient } from '@supabase/supabase-js';
import process from 'node:process';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || (!supabaseServiceRoleKey && !supabaseAnonKey)) {
  throw new Error('Missing SUPABASE_URL and one of SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
