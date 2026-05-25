import { runAgentForPosition } from '../lib/skd-agent.js';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Read environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error("❌ Error: .env.local file not found at project root.");
  process.exit(1);
}

const envText = fs.readFileSync(envPath, 'utf-8');
const urlMatch = envText.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*([^\n\r]+)/);
const keyMatch = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*([^\n\r]+)/);
const geminiMatch = envText.match(/GEMINI_API_KEY\s*=\s*([^\n\r]+)/);

if (!urlMatch || !keyMatch) {
  console.error("❌ Error: Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();
const geminiApiKey = geminiMatch ? geminiMatch[1].trim() : '';

process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseKey;
process.env.GEMINI_API_KEY = geminiApiKey;

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Configuration Parameters
// - CONCURRENCY: Number of parallel workers (keep 1-3 for free tier, 5-10 for paid keys)
// - DELAY_BETWEEN_REQS: Time in ms to wait between runs to stay under rate limits (RPM)
const CONCURRENCY = parseInt(process.env.BATCH_CONCURRENCY || '3');
const DELAY_BETWEEN_REQS = parseInt(process.env.BATCH_DELAY || '2500'); 

async function runBatch() {
  console.log("==================================================================");
  console.log("🤖 SARKARDADA AI ACCOUNTABILITY ENGINE - CLI BATCH RUNNER");
  console.log("==================================================================");
  console.log(`📡 Connected to: ${supabaseUrl}`);
  console.log(`⚙️ Concurrency: ${CONCURRENCY} workers`);
  console.log(`⏱️ Base delay: ${DELAY_BETWEEN_REQS}ms per worker task`);
  console.log("==================================================================");

  // Fetch all positions along with their AI rating state
  console.log("📥 Fetching active position profiles...");
  const { data: positions, error } = await supabase
    .from('view_positions_live_scores')
    .select('*');

  if (error || !positions) {
    console.error("❌ Failed to fetch positions:", error?.message || "No data");
    process.exit(1);
  }

  console.log(`📊 Found ${positions.length} total position records on the platform.`);

  // Filter out those that already have a successful completed status
  const pending = positions.filter(p => !p.skd_status || p.skd_status !== 'completed');
  console.log(`⏳ Pending evaluations to process: ${pending.length} positions.`);

  if (pending.length === 0) {
    console.log("🎉 All public positions have been fully evaluated and grounded. Exiting.");
    process.exit(0);
  }

  let index = 0;
  let completed = 0;
  let failed = 0;
  const startTime = Date.now();

  // Worker implementation
  async function worker(workerId) {
    while (true) {
      // Safely claim the next available index
      const currentIdx = index++;
      if (currentIdx >= pending.length) break;

      const position = pending[currentIdx];
      const percent = (((currentIdx + 1) / pending.length) * 100).toFixed(1);
      console.log(`[Worker ${workerId}] [${currentIdx + 1}/${pending.length} - ${percent}%] Evaluating: ${position.position_title} (${position.current_official_name})...`);

      try {
        const result = await runAgentForPosition(position);
        if (result.success) {
          completed++;
          console.log(`[Worker ${workerId}] ✅ Success: ${position.position_title} (AI Overall: ${result.skd_overall_score})`);
        } else {
          failed++;
          console.error(`[Worker ${workerId}] ❌ Failed: ${position.position_title} - Error: ${result.error}`);
        }
      } catch (err) {
        failed++;
        console.error(`[Worker ${workerId}] 💥 Unexpected Error for ${position.position_title}:`, err.message);
      }

      // Add delay to prevent rate limit spikes
      if (index < pending.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQS));
      }
    }
  }

  // Spawn parallel worker threads
  const workers = [];
  for (let w = 1; w <= CONCURRENCY; w++) {
    workers.push(worker(w));
  }

  // Wait for all workers to finish
  await Promise.all(workers);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("==================================================================");
  console.log("🎉 BATCH RUN COMPLETE!");
  console.log("==================================================================");
  console.log(`📈 Completed successfully: ${completed}`);
  console.log(`📉 Failed: ${failed}`);
  console.log(`⏱️ Total time elapsed: ${durationSec}s`);
  console.log(`🚀 Avg Speed: ${(completed / (durationSec / 60)).toFixed(2)} ratings/minute`);
  console.log("==================================================================");
}

runBatch().catch(err => {
  console.error("💥 Fatal batch run failure:", err);
  process.exit(1);
});
