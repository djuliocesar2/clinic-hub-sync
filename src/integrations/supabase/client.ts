import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jbzjynpumhpendncipaj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_hu8dnCAX9DEKry1Jyo3SZQ_VI6JfIUh';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
