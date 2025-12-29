import { createClient } from '@supabase/supabase-js';

// Ensure environment variables are set or provide fallbacks/warnings
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase environment variables missing (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY).');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
