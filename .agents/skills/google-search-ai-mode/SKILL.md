---
name: google-search-ai-mode
description: "Use when performing live web intelligence, executive talent sourcing, or real-time query fan-out using Google Search AI Mode (udm=50) or Gemini Search Grounding"
metadata:
  origin: auto-extracted-from-google-ai
---

# Google Search AI Mode (`udm=50`) Intelligence & Sourcing

**Extracted:** 2026-10-09  
**Context:** Sourcing live web data, executive leadership contacts, verified LinkedIn URLs, and real-time facts using Google Search's dedicated AI canvas.

## Key Discovery: The `udm=50` Parameter
Google Search triggers its conversational AI Mode directly via:
```http
https://www.google.com/search?q={ENCODED_QUERY}&udm=50
```

When triggered:
1. Google loads an interactive conversational AI canvas.
2. The search backend automatically performs query fan-out (parallel sub-searches across company directories, public LinkedIn profiles, and news releases).
3. Google Gemini synthesizes citations with direct reference links (`a.PMDqCb`, `/in/{slug}`).

## Sourcing Architecture Pattern
Always employ a two-tier execution priority model:

### Tier 1 (Zero-Quota / Interactive Chrome CDP)
- Check if local Chrome is running with `--remote-debugging-port=9222`.
- Query `http://127.0.0.1:9222/json/version` to test availability.
- Connect via WebSocket CDP (`ws://127.0.0.1:9222/devtools/page/...`).
- Open or attach to the Google AI Mode tab with `udm=50`.
- Extract DOM elements and citation links.
- Fuzzy-match LinkedIn profiles by matching full name slugs (`tokens.join('-')`) or first/last tokens in `/in/` hrefs.

### Tier 2 (Headless API via Gemini Grounding)
- Target model: `gemini-2.0-flash:generateContent`.
- Activate native Google search tool: `tools: [{ googleSearch: {} }]`.
- Parse `candidates[0].groundingMetadata`:
  - `webSearchQueries`: The underlying sub-queries Google AI ran.
  - `groundingChunks`: The exact source URLs and citations.
- Parse structured output with fallback chain (Direct JSON -> Code block -> Regex array -> Markdown table).

## When to Use
- Sourcing leadership/executives (CEOs, Founders, Talent Acquisition heads) for target companies.
- Researching company data requiring multi-query web fan-out across public directories and LinkedIn.
- Extracting live citations and public contact references without getting blocked by bot captchas.
