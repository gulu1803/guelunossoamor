// Supabase bootstrap (no UI side effects)
export const SUPABASE_URL = 'https://jtjbghqkieabszuykogm.supabase.co';      // ex: https://xxxx.supabase.co
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0amJnaHFraWVhYnN6dXlrb2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NDQyOTAsImV4cCI6MjA3MDUyMDI5MH0.ONjvK8XycwQ7MkJo1SmF38MxsRxO2mLKv_gIySzXadQ'; // anon key

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
