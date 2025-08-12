// Supabase bootstrap (no UI side effects)
export const SUPABASE_URL = '';      // ex: https://xxxx.supabase.co
export const SUPABASE_ANON_KEY = ''; // anon key

// Espaço compartilhado (deve bater com o SQL): 
export const SPACE_OWNER = 'shared-na';

// Mapeamento do login local -> email Supabase
export const SUPABASE_EMAILS = { 
  Gustavo:'gqppod@gmail.com', 
  Luiza:'luizadornelles927@gmail.com' 
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?bundle';

let _sb=null;
export function isSupabaseConfigured(){ 
  return SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length>20; 
}
export function getSupabase(){ 
  if(!_sb && isSupabaseConfigured()){ _sb=createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } 
  return _sb; 
}
