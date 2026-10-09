import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTalentSourcingJsonPrompt, extractJsonFromText } from '../src/prompt-builder.mjs';
import { buildGoogleAIModeUrl } from '../src/google-ai-mode-url.mjs';

test('Talent Sourcer: JSON Prompt Builder adheres to exact user specifications', () => {
  const company = 'Sapient Wealth';
  const prompt = buildTalentSourcingJsonPrompt(company);

  assert.ok(prompt.includes('Target Company: Sapient Wealth'));
  assert.ok(prompt.includes('Founders / Co-Founders / CEO'));
  assert.ok(prompt.includes('Head of Talent Acquisition / Lead Recruiter'));
  assert.ok(prompt.includes('Only report contact details that are publicly visible'));
  assert.ok(prompt.includes('"Not publicly disclosed"—do not guess'));
  assert.ok(prompt.includes('Required JSON Output Schema:'));
  assert.ok(prompt.includes('"linkedinUrl"'));
});

test('Talent Sourcer: extractJsonFromText handles fenced ```json blocks', () => {
  const mockText = `
Here are the sourced executives:
\`\`\`json
[
  {
    "fullName": "Amit Bivalkar",
    "currentTitle": "Founder & Director",
    "company": "Sapient Wealth",
    "linkedinUrl": "https://www.linkedin.com/in/amit-bivalkar-0664084",
    "publicEmail": "accounts3.0@sapientwealth.co.in",
    "publicPhone": "+91 20 25250100",
    "sourceUrl": "https://sapientwealth.co.in"
  }
]
\`\`\`
Hope this helps!
`;

  const records = extractJsonFromText(mockText);
  assert.equal(records.length, 1);
  assert.equal(records[0].fullName, 'Amit Bivalkar');
  assert.equal(records[0].currentTitle, 'Founder & Director');
  assert.equal(records[0].linkedinUrl, 'https://www.linkedin.com/in/amit-bivalkar-0664084');
});

test('Talent Sourcer: extractJsonFromText handles direct JSON array and markdown fallback', () => {
  const rawArray = [
    {
      fullName: 'Dhruv Mehta',
      currentTitle: 'Chairman',
      company: 'Sapient Wealth',
      linkedinUrl: 'https://linkedin.com/in/dhruv-mehta',
      publicEmail: 'dhruv@sapientwealth.co.in',
      publicPhone: '+91 22 4011 1950',
      sourceUrl: 'https://sapientwealth.co.in'
    }
  ];

  const parsed = extractJsonFromText(JSON.stringify(rawArray));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].fullName, 'Dhruv Mehta');

  // Fallback markdown table test
  const mdTable = `
| Full Name | Current Title / Role | Company | LinkedIn Profile URL | Public Email | Public Phone / Office Contact | Source / Reference URL |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Bhavik Shah | HRBP | Sapient Wealth | https://linkedin.com/in/bhavik | Not publicly disclosed | Not publicly disclosed | https://linkedin.com |
`;
  const tableParsed = extractJsonFromText(mdTable);
  assert.equal(tableParsed.length, 1);
  assert.equal(tableParsed[0].fullName, 'Bhavik Shah');
  assert.equal(tableParsed[0].linkedinUrl, 'https://linkedin.com/in/bhavik');
});

test('Talent Sourcer: Google AI Mode URL sets udm=50', () => {
  const url = buildGoogleAIModeUrl('Sapient Wealth');
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get('udm'), '50');
});
