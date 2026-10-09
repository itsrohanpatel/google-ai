/**
 * Prompt Templates & Output Formatters for Executive Talent Sourcing
 */

export function buildTalentSourcingPrompt(companyName) {
  return `Act as a Live Web Intelligence and Executive Talent Sourcing Agent.

Your task is to search the live web and public LinkedIn data for the following company:
Target Company: ${companyName}

---

### Sourcing Objectives:
1. Identify key leadership and HR/recruitment contacts at this company, specifically:
   - Founders / Co-Founders / CEO
   - Chief People Officer / VP of HR / Head of Human Resources
   - Head of Talent Acquisition / Lead Recruiter
2. Check public LinkedIn summaries, official website team pages, press releases, and directory pages to see if any of these individuals have publicly listed:
   - Work or professional email addresses
   - Direct or public office contact numbers
   - Direct LinkedIn profile URLs

---

### Constraints:
- Use live Google Search to confirm that these individuals currently work at the target company.
- Only report contact details that are publicly visible on the open web. If an email or phone number is not publicly mentioned, write "Not publicly disclosed"—do not guess.

---

### Output Format:
Display the findings in this structured markdown table:

| Full Name | Current Title / Role | Company | LinkedIn Profile URL | Public Email | Public Phone / Office Contact | Source / Reference URL |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;
}

export function buildTalentSourcingJsonPrompt(companyName) {
  return `Act as a Live Web Intelligence and Executive Talent Sourcing Agent.

Your task is to search the live web and public LinkedIn data in detail for the following company:
Target Company: ${companyName}

---

### Sourcing Objectives:
1. Identify key leadership and HR/recruitment contacts at this company, specifically:
   - Founders / Co-Founders / CEO / Managing Directors
   - Chief People Officer / VP of HR / Head of Human Resources
   - Head of Talent Acquisition / Lead Recruiter
2. Check public LinkedIn summaries, official website team pages, press releases, and directory pages to see if any of these individuals have publicly listed:
   - Work or professional email addresses
   - Direct or public office contact numbers
   - Direct LinkedIn profile URLs

---

### Constraints:
- Use live Google Search to confirm that these individuals currently work at the target company.
- Only report contact details that are publicly visible on the open web. If an email or phone number is not publicly mentioned, write "Not publicly disclosed"—do not guess.
- You must return ONLY a valid, parseable JSON array of objects, with NO surrounding conversational commentary, preamble, or markdown formatting outside the JSON array.

---

### Required JSON Output Schema:
[
  {
    "fullName": "Full Name of Executive",
    "currentTitle": "Current Title / Role",
    "company": "${companyName}",
    "linkedinUrl": "Full direct LinkedIn profile URL or 'Not publicly disclosed'",
    "publicEmail": "Publicly verified email or 'Not publicly disclosed'",
    "publicPhone": "Publicly verified office/direct phone or 'Not publicly disclosed'",
    "sourceUrl": "Source citation or reference URL"
  }
]
`;
}

/**
 * Extracts and parses JSON array from model output
 */
export function extractJsonFromText(text) {
  if (!text || typeof text !== 'string') return [];
  
  // 1. Try direct JSON.parse
  try {
    const direct = JSON.parse(text.trim());
    if (Array.isArray(direct)) return direct;
    if (direct && typeof direct === 'object') {
      const arrayKey = Object.values(direct).find(v => Array.isArray(v));
      if (arrayKey) return arrayKey;
      return [direct];
    }
  } catch (_) {}

  // 2. Strip ```json ... ``` codeblocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return [parsed];
    } catch (_) {}
  }

  // 3. Regex extract first [ ... ] array
  const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
  }

  // 4. Fallback: Parse markdown table into JSON array
  const tableLines = text.split('\n').filter(l => l.trim().startsWith('|'));
  if (tableLines.length >= 3) {
    const rows = [];
    // Skip header (0) and separator (1)
    for (let i = 2; i < tableLines.length; i++) {
      const cells = tableLines[i].split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3) {
        rows.push({
          fullName: cells[0] || 'Not publicly disclosed',
          currentTitle: cells[1] || 'Not publicly disclosed',
          company: cells[2] || companyName,
          linkedinUrl: cells[3] || 'Not publicly disclosed',
          publicEmail: cells[4] || 'Not publicly disclosed',
          publicPhone: cells[5] || 'Not publicly disclosed',
          sourceUrl: cells[6] || 'Not publicly disclosed'
        });
      }
    }
    if (rows.length > 0) return rows;
  }

  return [];
}
