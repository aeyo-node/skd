/**
 * SKD AI Rating Cloud-Native Background Batch Endpoint
 * 
 * GET  /api/skd-agent-batch - Returns current background worker state.
 * POST /api/skd-agent-batch - Triggers start or stop actions on the worker.
 */

import { NextResponse } from 'next/server';
import { getBatchStatus, startBatchBackground, stopBatch } from '../../../lib/skd-agent';

export async function GET() {
  try {
    const status = getBatchStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('[SKD Agent Batch GET Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch background status' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, concurrency } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter ("start" or "stop") is required.' },
        { status: 400 }
      );
    }

    if (action === 'start') {
      const result = await startBatchBackground(concurrency || 2);
      return NextResponse.json(result);
    } else if (action === 'stop') {
      const result = stopBatch();
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: `Invalid action "${action}". Supported actions: "start", "stop"` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[SKD Agent Batch POST Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
