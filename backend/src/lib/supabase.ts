import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

// Supabase client - opcional, pode não estar configurado em desenvolvimento
if (!config.supabase.url || !config.supabase.key) {
    console.warn('⚠️ Supabase environment variables missing (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY).');
}

export const supabase = createClient(config.supabase.url, config.supabase.key);
