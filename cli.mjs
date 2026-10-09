#!/usr/bin/env node

/**
 * CLI Runner for Google Search AI Mode Executive Talent Sourcing
 * Searches the live web and LinkedIn in detail via Google AI Mode,
 * returning pure JSON directly in the terminal.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isChromeCdpAvailable, sourceWithLiveChromeAiMode } from './src/cdp-browser-sourcer.mjs';
import { sourceWithGeminiGrounding } from './src/gemini-grounding-engine.mjs';
import { buildGoogleAIModeUrl } from './src/google-ai-mode-url.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Auto-load standalone-talent-sourcer/.env if present
const localEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(localEnvPath)) {
  const envContent = fs.readFileSync(localEnvPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      const val = v.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (k.trim() && !process.env[k.trim()]) {
        process.env[k.trim()] = val;
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const companyArg = args.find(a => !a.startsWith('--'));
  const keyArg = args.find(a => a.startsWith('--key='))?.replace('--key=', '');
  const apiKey = keyArg || process.env.GEMINI_API_KEY;

  if (!companyArg) {
    console.error(JSON.stringify({
      error: "Missing company name argument.",
      usage: "node cli.mjs \"<Company Name>\" [--key=<GEMINI_API_KEY>]",
      example: "node cli.mjs \"Sapient Wealth\""
    }, null, 2));
    process.exit(1);
  }

  const company = companyArg.trim();

  // Engine Priority 1: Direct Live Chrome AI Mode (via Chrome CDP on port 9222)
  const cdpReady = await isChromeCdpAvailable(9222);
  if (cdpReady) {
    process.stderr.write(`🔍 Searching live web & LinkedIn for "${company}" via Chrome Google AI Mode (udm=50)...\n`);
    try {
      const cdpResult = await sourceWithLiveChromeAiMode(company, 9222);
      console.log(JSON.stringify(cdpResult, null, 2));
      return;
    } catch (cdpErr) {
      process.stderr.write(`⚠️ Chrome CDP extraction warning: ${cdpErr.message}. Trying API fallback...\n`);
    }
  }

  // Engine Priority 2: Google Gemini Search Grounding API (if API key provided)
  if (apiKey) {
    process.stderr.write(`🔍 Searching live web & LinkedIn for "${company}" using Google Gemini Search Grounding...\n`);
    try {
      const apiResult = await sourceWithGeminiGrounding(company, apiKey);
      const output = {
        company,
        totalContacts: apiResult.records.length,
        contacts: apiResult.records,
        sources: apiResult.groundingSources.slice(0, 10),
        searchQueriesRan: apiResult.searchQueries
      };
      console.log(JSON.stringify(output, null, 2));
      return;
    } catch (apiErr) {
      console.error(JSON.stringify({
        error: apiErr.message,
        company
      }, null, 2));
      process.exit(1);
    }
  }

  // Engine Priority 3: Fallback guidance
  const prompt = `Sapient Wealth founders CEO HR talent acquisition leadership`;
  const aiModeUrl = buildGoogleAIModeUrl(prompt);

  console.error(JSON.stringify({
    status: "AI_MODE_REQUIRES_CONNECTION",
    message: "Could not connect to Chrome on port 9222 and no GEMINI_API_KEY was provided.",
    quickStart: [
      "1. Make sure Chrome is open with remote debugging enabled (--remote-debugging-port=9222)",
      "2. OR run with a free Gemini key: node cli.mjs \"" + company + "\" --key=YOUR_API_KEY"
    ],
    interactiveAiModeUrl: aiModeUrl
  }, null, 2));
  process.exit(1);
}

main();
