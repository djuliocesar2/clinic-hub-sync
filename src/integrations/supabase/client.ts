import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gakcrhpplrdjmvankvod.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3a1s7_SIeGKRNg_RJHbxiw_ls4MozV_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
