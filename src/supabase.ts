import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'REPLACE_WITH_ANON_KEY') {
  console.warn(
    '[OutsourceAI] Supabase env vars missing or placeholder. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable realtime logs.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
