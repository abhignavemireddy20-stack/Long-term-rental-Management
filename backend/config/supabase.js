// Shared Supabase client — uses HTTPS REST API (works through any firewall)
// Lazy initialization to handle ES module import hoisting (dotenv may not have run yet at import time)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // Ensure env vars are loaded even if this module is imported first

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nqacclngiqegmfmmglky.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYWNjbG5naXFlZ21mbW1nbGt5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc1MjY3MCwiZXhwIjoyMDk3MzI4NjcwfQ.AQKhG-WfmzOmy1tvmgkpk5dUVkQkXONiuOlKYA-DgWI';

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
