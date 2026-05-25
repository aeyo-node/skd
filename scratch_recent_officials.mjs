import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local to get Supabase credentials using absolute path
const envPath = "c:\\Users\\chris\\Documents\\public acc platform\\.env.local";
const envText = fs.readFileSync(envPath, 'utf-8');
const urlMatch = envText.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*([^\n\r]+)/);
const keyMatch = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*([^\n\r]+)/);

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Fetching 10 most recent officials...");
  const { data, error } = await supabase
    .from('officials')
    .select('id, first_name, last_name, service_cadre, image_url, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(data);
  }
}

check();
