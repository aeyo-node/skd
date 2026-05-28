/**
 * SKD AI Rating Agent Engine
 * 
 * Pipeline: Supabase Position → Build Search Query → Gemini + Google Search Grounding → Score → Upsert
 * 
 * Uses Gemini 2.0 Flash with built-in Google Search grounding to find real-time
 * information about Indian government officials and produce objective ratings.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client (uses anon key but with RLS policies allowing inserts)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Build a targeted search query for an official
 */
function buildSearchQuery(position) {
  const parts = [];
  
  if (position.current_official_name && position.current_official_name !== 'Vacant') {
    parts.push(position.current_official_name);
  }
  
  // Use a shortened position title (first 60 chars)
  const shortTitle = position.position_title.split(';')[0].split(' and also')[0].trim();
  parts.push(shortTitle);
  
  if (position.state_name) parts.push(position.state_name);
  if (position.district_name) parts.push(position.district_name);
  
  parts.push('India');
  parts.push('performance news corruption efficiency');
  
  return parts.join(' ');
}

/**
 * Build the Gemini analysis prompt
 */
function buildAnalysisPrompt(position, searchQuery) {
  return `You are a senior Indian government accountability analyst for Sarkardada.com, a non-partisan public servant rating platform.

Based on your knowledge and any available information about this public servant, provide an energetic, objective, and evidence-based assessment. We want to present this information to the public in a highly visual, scannable format so they can understand the official's record in under 10 seconds.

## OFFICIAL PROFILE
- **Name:** ${position.current_official_name || 'Unknown'}
- **Position:** ${position.position_title}
- **Department:** ${position.department_name || 'N/A'}
- **Service Cadre:** ${position.service_cadre || 'N/A'}
- **Location:** ${[position.district_name, position.state_name].filter(Boolean).join(', ') || 'Central Government'}
- **Geographic Tier:** ${position.tier || 'Central'}

## SEARCH CONTEXT
The following search was performed: "${searchQuery}"

## YOUR TASK
Analyze this official's PUBLIC RECORD and score them on three dimensions. Use only verifiable public information. If information is scarce, indicate that in your analysis and give moderate scores (5.0-6.0).

Score each dimension from 0.00 to 10.00:

1. **Integrity & Transparency (score_integrity):** Anti-corruption track record, financial transparency, conflicts of interest, legal proceedings, RTI compliance.

2. **Administrative Efficiency (score_efficiency):** Project delivery record, response times, policy implementation, infrastructure development, crisis management.

3. **Public Accessibility (score_accessibility):** Citizen engagement, grievance redressal, public hearings, social media responsiveness, open-door policies.

## RESPONSE FORMAT
You MUST respond with ONLY valid JSON (no markdown, no code fences). Use this exact schema:
{
  "score_integrity": <number 0.00-10.00>,
  "score_efficiency": <number 0.00-10.00>,
  "score_accessibility": <number 0.00-10.00>,
  "skd_overall_score": <number 0.00-10.00, average of three scores>,
  "analysis_summary": {
    "verdict": "<an energetic, punchy 1-sentence public verdict of their overall stance, accomplishments, and vibe>",
    "key_works": [
      "<energetic bullet point highlighting major work, milestone, or achievement 1 with year/context if known>",
      "<energetic bullet point highlighting major work, milestone, or achievement 2>"
    ],
    "drawbacks": [
      "<specific, factual bullet point highlighting concern, controversy, vigilance case, drawback, or public criticism 1>",
      "<specific, factual bullet point highlighting concern, controversy, vigilance case, drawback, or public criticism 2>"
    ],
    "citizen_takeaway": "<easy to understand 1-2 sentence takeaway of what their performance means for the common man>",
    "identity_tags": ["<tag1, e.g. Proactive>", "<tag2, e.g. Controversial>", "<tag3, e.g. Accessible>"]
  },
  "sources": ["<url1>", "<url2>"]
}

IMPORTANT:
- Be objective and factual. Do not make up scandals or achievements.
- If you have no specific information, give scores in the 5.0-6.0 range and state "Limited public information available." in the verdict, key_works, drawbacks, and citizen_takeaway, and use neutral tags.
- Provide 2 key_works and 2 drawbacks if information is available. Each bullet point must be specific, factual, and energetic.
- The overall score MUST be the arithmetic mean of the three sub-scores, rounded to 2 decimal places.
- Sources should be real URLs you referenced. If none available, use an empty array [].`;
}

/**
 * Helper to generate content from Gemini with exponential backoff on rate limit or server errors
 */
async function generateContentWithRetry(model, prompt, maxRetries = 5, initialDelay = 3000) {
  let delay = initialDelay;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      return result;
    } catch (error) {
      const errorMsg = error.message || '';
      const isRateLimit = errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('rate limit');
      const isServerError = errorMsg.includes('500') || errorMsg.includes('503') || errorMsg.toLowerCase().includes('overloaded') || errorMsg.toLowerCase().includes('server error');
      
      if ((isRateLimit || isServerError) && attempt < maxRetries) {
        console.warn(`[SKD Agent] Attempt ${attempt} failed. Retrying in ${delay}ms... Error: ${errorMsg}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}

/**
 * Run the SKD agent for a single position
 */
export async function runAgentForPosition(position) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured. Add your key to .env.local'
    };
  }

  const positionId = position.position_id;

  try {
    // 1. Mark as running
    await supabase
      .from('skd_ai_ratings')
      .upsert({
        position_id: positionId,
        official_id: position.current_official_id,
        status: 'running',
        updated_at: new Date().toISOString()
      }, { onConflict: 'position_id' });

    // 2. Build search query (used as context in prompt)
    const searchQuery = buildSearchQuery(position);

    // 3. Call Google Gemini SDK with Search Grounding
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} }] // Enable Google Search grounding
    });

    const prompt = buildAnalysisPrompt(position, searchQuery);

    const result = await generateContentWithRetry(model, prompt);

    const response = result.response;
    const text = response.text();

    // 4. Parse the JSON response
    // Strip any markdown code fences if present
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseErr) {
      // Try to extract JSON from the response using regex
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Failed to parse Gemini response as JSON: ${cleanText.substring(0, 200)}`);
      }
    }

    // 5. Validate and clamp scores
    const clamp = (val, min = 0, max = 10) => {
      const num = parseFloat(val);
      if (isNaN(num)) return 5.0;
      return Math.min(max, Math.max(min, Math.round(num * 100) / 100));
    };

    const integrity = clamp(parsed.score_integrity);
    const efficiency = clamp(parsed.score_efficiency);
    const accessibility = clamp(parsed.score_accessibility);
    const overall = Math.round(((integrity + efficiency + accessibility) / 3) * 100) / 100;

    const sources = Array.isArray(parsed.sources) ? parsed.sources.filter(s => typeof s === 'string') : [];
    
    let summary;
    if (typeof parsed.analysis_summary === 'object' && parsed.analysis_summary !== null) {
      summary = JSON.stringify(parsed.analysis_summary);
    } else if (typeof parsed.analysis_summary === 'string') {
      summary = parsed.analysis_summary;
    } else {
      summary = 'Analysis completed.';
    }

    // Extract grounding sources from Gemini response metadata if available
    let groundingSources = [...sources];
    try {
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web?.uri && !groundingSources.includes(chunk.web.uri)) {
            groundingSources.push(chunk.web.uri);
          }
        }
      }
    } catch (e) {
      console.warn("Grounding metadata extraction failed:", e);
    }

    // 6. Upsert the final result
    const { error: upsertError } = await supabase
      .from('skd_ai_ratings')
      .upsert({
        position_id: positionId,
        official_id: position.current_official_id,
        score_integrity: integrity,
        score_efficiency: efficiency,
        score_accessibility: accessibility,
        skd_overall_score: overall,
        analysis_summary: summary,
        search_sources: groundingSources,
        search_query: searchQuery,
        model_used: 'gemini-2.5-flash',
        status: 'completed',
        error_message: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'position_id' });

    if (upsertError) {
      throw new Error(`Supabase upsert failed: ${upsertError.message}`);
    }

    return {
      success: true,
      position_id: positionId,
      position_title: position.position_title,
      skd_overall_score: overall,
      score_integrity: integrity,
      score_efficiency: efficiency,
      score_accessibility: accessibility,
      summary,
      sources: groundingSources
    };

  } catch (error) {
    console.error(`SKD Agent error for position ${positionId}:`, error);

    // Mark as failed in the database
    await supabase
      .from('skd_ai_ratings')
      .upsert({
        position_id: positionId,
        official_id: position.current_official_id,
        status: 'failed',
        error_message: error.message || 'Unknown error',
        updated_at: new Date().toISOString()
      }, { onConflict: 'position_id' });

    return {
      success: false,
      position_id: positionId,
      error: error.message
    };
  }
}

/**
 * Run the SKD agent for ALL positions in the database
 * Processes sequentially to respect API rate limits
 */
export async function runAgentForAll() {
  // Fetch all positions from the live scores view
  const { data: positions, error } = await supabase
    .from('view_positions_live_scores')
    .select('*');

  if (error || !positions) {
    return { success: false, error: 'Failed to fetch positions from database', results: [] };
  }

  // Only evaluate positions that don't have a completed SKD rating
  const pendingPositions = positions.filter(p => !p.skd_status || p.skd_status !== 'completed');

  if (pendingPositions.length === 0) {
    return {
      success: true,
      total: 0,
      completed: 0,
      failed: 0,
      results: [],
      message: 'All results grounded'
    };
  }

  const results = [];
  let completed = 0;
  let failed = 0;

  for (const position of pendingPositions) {
    // Add a 1.5-second delay between requests to respect rate limits
    if (results.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    const result = await runAgentForPosition(position);
    results.push(result);

    if (result.success) {
      completed++;
    } else {
      failed++;
    }
  }

  return {
    success: true,
    total: positions.length,
    completed,
    failed,
    results
  };
}

// In-memory status of the active background batch run
let batchState = {
  status: 'idle', // 'idle' | 'running' | 'stopped'
  total: 0,
  completed: 0,
  failed: 0,
  currentIndex: 0,
  currentOfficial: '',
  currentPositionTitle: '',
  startTime: null,
  stopRequested: false,
  error: null
};

/**
 * Get current in-memory status of the batch job
 */
export function getBatchStatus() {
  return batchState;
}

/**
 * Stop the background batch job cleanly
 */
export function stopBatch() {
  if (batchState.status === 'running') {
    batchState.stopRequested = true;
    batchState.status = 'stopped';
    return { success: true, message: 'Stop requested. Current official will finish processing before stopping.' };
  }
  return { success: false, message: 'No active background batch job is running.' };
}

/**
 * Main background worker loop
 */
async function runBackgroundLoop(pendingPositions, concurrency) {
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < pendingPositions.length && !batchState.stopRequested) {
      const index = nextIndex++;
      if (index >= pendingPositions.length || batchState.stopRequested) break;

      const pos = pendingPositions[index];

      // Update state
      batchState.currentIndex = index + 1;
      batchState.currentOfficial = pos.current_official_name || 'Vacant';
      batchState.currentPositionTitle = pos.position_title;

      console.log(`[SKD Cloud Batch] Processing ${index + 1}/${pendingPositions.length}: ${pos.position_title} (${pos.current_official_name})`);

      try {
        const result = await runAgentForPosition(pos);
        if (result.success) {
          batchState.completed++;
        } else {
          batchState.failed++;
          console.error(`[SKD Cloud Batch] Failed for ${pos.position_title}:`, result.error);
        }
      } catch (err) {
        batchState.failed++;
        console.error(`[SKD Cloud Batch] Error for ${pos.position_title}:`, err);
      }

      // Respect rate limits and API quotas with a 2-second sleep between requests
      if (nextIndex < pendingPositions.length && !batchState.stopRequested) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  // Spawn parallel workers based on concurrency setting
  const workers = [];
  for (let i = 0; i < Math.min(concurrency, pendingPositions.length); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  // Transition state to final state
  if (batchState.stopRequested) {
    batchState.status = 'stopped';
  } else {
    batchState.status = 'idle';
  }
  
  console.log(`[SKD Cloud Batch] Completed execution loop. Final Status: ${batchState.status}. Progress: ${batchState.completed}/${batchState.total}`);
}

/**
 * Start the background batch job (non-blocking)
 */
export async function startBatchBackground(concurrency = 2) {
  if (batchState.status === 'running') {
    return { success: false, message: 'Cloud batch run is already in progress.', status: batchState };
  }

  // Fetch all positions from the database view
  const { data: positions, error } = await supabase
    .from('view_positions_live_scores')
    .select('*');

  if (error || !positions) {
    return { success: false, error: 'Failed to fetch positions from database' };
  }

  // Find all positions that do not have a completed SKD rating
  const pendingPositions = positions.filter(p => !p.skd_status || p.skd_status !== 'completed');

  if (pendingPositions.length === 0) {
    return {
      success: true,
      message: 'All positions have already been evaluated.',
      total: 0,
      completed: 0,
      status: 'idle'
    };
  }

  // Initialize background state
  batchState = {
    status: 'running',
    total: pendingPositions.length,
    completed: 0,
    failed: 0,
    currentIndex: 0,
    currentOfficial: '',
    currentPositionTitle: '',
    startTime: new Date().toISOString(),
    stopRequested: false,
    error: null
  };

  // Run in background without awaiting
  runBackgroundLoop(pendingPositions, concurrency).catch(err => {
    console.error('[SKD Cloud Batch] Unhandled rejection:', err);
    batchState.status = 'idle';
    batchState.error = err.message || 'Fatal background runner error';
  });

  return {
    success: true,
    message: `Background batch run initiated for ${pendingPositions.length} positions.`,
    status: batchState
  };
}

