import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local to get Supabase credentials using absolute path
const envPath = "c:\\Users\\chris\\Documents\\public acc platform\\.env.local";
const envText = fs.readFileSync(envPath, 'utf-8');
const urlMatch = envText.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*([^\n\r]+)/);
const keyMatch = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*([^\n\r]+)/);

if (!urlMatch || !keyMatch) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking officials table...");
  const { data: officials, error, count } = await supabase
    .from('officials')
    .select('id, first_name, last_name, service_cadre, image_url', { count: 'exact' });

  if (error) {
    console.error("Error fetching officials:", error);
  } else {
    console.log(`Total officials: ${count}`);
    if (officials && officials.length > 0) {
      console.log("Sample officials:");
      console.log(officials.slice(0, 5));
      const withImages = officials.filter(o => o.image_url);
      console.log(`Officials with images: ${withImages.length}`);
      if (withImages.length > 0) {
        console.log("Sample officials with images:");
        console.log(withImages.slice(0, 5));
      }
    }
  }

  console.log("\nChecking positions table...");
  const { data: positions, error: posErr, count: posCount } = await supabase
    .from('positions')
    .select('id, title, current_official_id', { count: 'exact' });

  if (posErr) {
    console.error("Error fetching positions:", posErr);
  } else {
    console.log(`Total positions: ${posCount}`);
  }
}

check();
