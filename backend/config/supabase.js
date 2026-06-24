// Shared Supabase client — uses HTTPS REST API (works through any firewall)
// Lazy initialization to handle ES module import hoisting (dotenv may not have run yet at import time)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // Ensure env vars are loaded even if this module is imported first

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase credentials are not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
}

// Service role client — bypasses Row Level Security, for server-side use only
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabase;
