# Talent Sourcing & Contact Data Invariants

1. **No Speculative Contact Information**:
   - Never synthesize, extrapolate, or guess emails (e.g. pattern `first.last@company.com`) or direct phone numbers unless explicitly confirmed in verified live search grounding citations.
   - Any missing field MUST strictly be set to `"Not publicly disclosed"`.

2. **Slug Matching for Professional Profiles**:
   - When extracting LinkedIn URLs from search results, match full name slugs (`tokens.join('-')`) or multi-token name pairs in href paths to prevent associating the wrong executive's profile.

3. **Dual-Format Output Resilience**:
   - Output parsers must accept:
     - Pure JSON arrays
     - Fenced markdown code blocks (` ```json ... ``` `)
     - Markdown tables as structured fallback rows
