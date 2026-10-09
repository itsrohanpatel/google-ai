/**
 * Google Gemini API Engine with Native Google Search Grounding (AI Mode Backend)
 * Runs live web search in detail and returns results formatted as a strict JSON array.
 */

import { buildTalentSourcingJsonPrompt, extractJsonFromText } from './prompt-builder.mjs';

export async function sourceWithGeminiGrounding(companyName, apiKey = process.env.GEMINI_API_KEY, model = 'gemini-2.0-flash') {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required to run Google AI Search Grounding. Provide via environment variable or --key argument.');
  }

  const prompt = buildTalentSourcingJsonPrompt(companyName);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    tools: [
      {
        googleSearch: {} // Activates Google Search Grounding (AI Mode backend)
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2500
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Gemini Search API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const searchQueries = data.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];
  const groundingSources = data.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
    title: chunk.web?.title || '',
    uri: chunk.web?.uri || ''
  })) || [];

  // Parse into clean JSON array
  const parsedRecords = extractJsonFromText(text);

  return {
    records: parsedRecords,
    totalFound: parsedRecords.length,
    rawText: text,
    searchQueries,
    groundingSources
  };
}
