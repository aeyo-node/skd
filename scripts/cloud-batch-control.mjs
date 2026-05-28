#!/usr/bin/env node

/**
 * Sarkardada SKD Agent Cloud Batch Control CLI
 * 
 * Usage:
 *   node scripts/cloud-batch-control.mjs <command> [service-url]
 * 
 * Commands:
 *   start   - Initiate the server-side background batch rating run
 *   stop    - Terminate any running server-side background batch cleanly
 *   status  - Fetch current background status and metrics
 */

import http from 'http';
import https from 'https';

const args = process.argv.slice(2);
const command = args[0]; // 'start', 'stop', 'status'
const urlArg = args[1];  // optional url

if (!command || !['start', 'stop', 'status'].includes(command)) {
  console.log(`
Sarkardada AI Agent Cloud Batch Control CLI
==========================================
Usage:
  node scripts/cloud-batch-control.mjs <command> [service-url]

Commands:
  start   - Trigger the cloud background batch processing
  stop    - Halt the cloud background batch processing cleanly
  status  - Retrieve current running state and progress metrics

Example:
  node scripts/cloud-batch-control.mjs status http://localhost:3050
  node scripts/cloud-batch-control.mjs start https://sarkardada-platform-xyz.a.run.app
  `);
  process.exit(1);
}

// Fallback to local address if no URL parameter is provided
const rawUrl = urlArg || 'http://localhost:3050';
const serviceUrl = rawUrl.replace(/\/$/, '');
const endpoint = `${serviceUrl}/api/skd-agent-batch`;

/**
 * Helper to perform HTTP/S requests without external dependencies
 */
function makeRequest(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = urlStr.startsWith('https:');
    const client = isHttps ? https : http;
    
    const req = client.request(urlStr, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ raw: data, statusCode: res.statusCode });
          }
        } else {
          try {
            const parsed = JSON.parse(data);
            reject(new Error(parsed.error || `HTTP Error ${res.statusCode}`));
          } catch (e) {
            reject(new Error(`HTTP Error ${res.statusCode}: ${data.substring(0, 100)}`));
          }
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function main() {
  console.log(`Connecting to: ${endpoint}...`);
  try {
    if (command === 'status') {
      const data = await makeRequest(endpoint, { method: 'GET' });
      
      console.log('\n📡 Cloud Batch Engine Status');
      console.log('============================');
      console.log(`Status:         ${data.status.toUpperCase()}`);
      console.log(`Total Pending:  ${data.total}`);
      console.log(`Completed:      ${data.completed}`);
      console.log(`Failed:         ${data.failed}`);
      console.log(`Current Index:  ${data.currentIndex}`);
      
      if (data.currentOfficial) {
        console.log(`Current Target: ${data.currentOfficial}`);
        console.log(`Current Office: ${data.currentPositionTitle}`);
      }
      
      if (data.startTime) {
        console.log(`Started At:     ${new Date(data.startTime).toLocaleString()}`);
      }
      
      if (data.error) {
        console.log(`Error message:  \x1b[31m${data.error}\x1b[0m`);
      }
      
      if (data.status === 'running') {
        const percent = Math.round(((data.completed + data.failed) / (data.total || 1)) * 100);
        console.log(`Progress Bar:   [${'#'.repeat(Math.round(percent / 5))}${' '.repeat(20 - Math.round(percent / 5))}] ${percent}%`);
      }
      console.log('============================\n');
      
    } else {
      // POST command
      const body = JSON.stringify({ action: command, concurrency: 2 });
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        },
        body
      };

      const data = await makeRequest(endpoint, options);
      console.log(`\n\x1b[32m✅ Response: ${data.message || 'Action executed successfully.'}\x1b[0m`);
      if (data.status) {
        console.log(`Cloud Status: ${data.status.status.toUpperCase()}`);
        console.log(`Total Pending: ${data.status.total}\n`);
      }
    }
  } catch (error) {
    console.error(`\n\x1b[31m❌ Control CLI Error: ${error.message}\x1b[0m`);
    console.log(`Ensure your service is active and listening at: ${endpoint}\n`);
    process.exit(1);
  }
}

main();
