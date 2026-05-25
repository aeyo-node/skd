import { runAgentForPosition } from './lib/skd-agent.js';
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
  console.log("Fetching position id 1...");
  const { data: positions, error } = await supabase
    .from('view_positions_live_scores')
    .select('*')
    .eq('position_id', 1);

  if (error || !positions || positions.length === 0) {
    console.error("Error fetching position:", error);
    process.exit(1);
  }

  const position = positions[0];
  console.log(`Found position: ${position.position_title} held by ${position.current_official_name}`);
  console.log("Running SKD AI agent...");

  const result = await runAgentForPosition(position);
  console.log("Result:", JSON.stringify(result, null, 2));
}

check();
