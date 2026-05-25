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
  console.log("Checking Judges...");
  const { data: judges, error: jErr } = await supabase
    .from('officials')
    .select('id, first_name, last_name, service_cadre, image_url')
    .eq('service_cadre', 'Judiciary');

  if (jErr) {
    console.error("Judges err:", jErr);
  } else {
    console.log(`Total Judges found: ${judges.length}`);
    const judgesWithImg = judges.filter(j => j.image_url);
    console.log(`Judges with image_url: ${judgesWithImg.length}`);
    if (judgesWithImg.length > 0) {
      console.log("Sample judge with image:", judgesWithImg[0]);
    }
  }

  console.log("\nChecking Chief Ministers...");
  const { data: cms, error: cErr } = await supabase
    .from('officials')
    .select('id, first_name, last_name, service_cadre, image_url')
    .ilike('first_name', '%Chandrababu%');

  if (cErr) {
    console.error("CMs err:", cErr);
  } else {
    console.log(`Total CMs matching Chandrababu: ${cms.length}`);
    if (cms.length > 0) {
      console.log("CM details:", cms[0]);
    }
  }
}

check();
