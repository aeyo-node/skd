/**
 * SKD AI Rating Agent API Route
 * 
 * POST /api/skd-agent
 * Body: { positionId: number | "all" }
 * 
 * Triggers the Gemini-powered agent to web-search and rate officials.
 * The GEMINI_API_KEY stays server-side — never exposed to the browser.
 */

import { NextResponse } from 'next/server';
import { runAgentForPosition, runAgentForAll } from '../../../lib/skd-agent';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { positionId } = body;

    if (!positionId) {
      return NextResponse.json(
        { error: 'positionId is required. Use a number or "all".' },
        { status: 400 }
      );
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured. Add your key to .env.local and restart the server.' },
        { status: 500 }
      );
    }

    // Run for all positions
    if (positionId === 'all') {
      const result = await runAgentForAll();
      return NextResponse.json(result);
    }

    // Run for a single position
    const numericId = parseInt(positionId);
    if (isNaN(numericId)) {
      return NextResponse.json(
        { error: 'positionId must be a number or "all".' },
        { status: 400 }
      );
    }

    // Fetch the position data
    const { data: positions, error } = await supabase
      .from('view_positions_live_scores')
      .select('*')
      .eq('position_id', numericId);

    if (error || !positions || positions.length === 0) {
      return NextResponse.json(
        { error: `Position ${numericId} not found.` },
        { status: 404 }
      );
    }

    const result = await runAgentForPosition(positions[0]);
    return NextResponse.json(result);

  } catch (error) {
    console.error('SKD Agent API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check agent status for all positions
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('skd_ai_ratings')
      .select('position_id, skd_overall_score, status, updated_at, error_message')
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      total: data?.length || 0,
      ratings: data || []
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
