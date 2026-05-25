import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = "c:\\Users\\chris\\Documents\\public acc platform\\.env.local";
const envText = fs.readFileSync(envPath, 'utf-8');
const urlMatch = envText.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*([^\n\r]+)/);
const keyMatch = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*([^\n\r]+)/);

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('view_positions_live_scores')
    .select('*')
    .limit(5);

  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
