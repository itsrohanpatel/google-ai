/**
 * Google AI Mode (udm=50) URL Generator & Browser Automation Metadata
 */

export function buildGoogleAIModeUrl(query, options = {}) {
  const { hl = 'en', gl = 'in' } = options;
  const baseUrl = 'https://www.google.com/search';
  const params = new URLSearchParams({
    q: query,
    udm: '50', // Forces Google AI Mode interface
    hl,
    gl
  });
  return `${baseUrl}?${params.toString()}`;
}

export const GOOGLE_AI_MODE_SELECTORS = {
  // Navigation / entry
  aiModeTab: 'a[href*="udm=50"], button[role="link"]:has-text("AI Mode")',
  
  // Interactive multi-turn chat input box
  chatInput: 'textarea.ITIRGe[placeholder="Ask anything"], textarea[placeholder*="Ask"]',
  submitButton: 'button[aria-label="Search"], button.Tg7LZd',
  
  // Response containers
  responseCard: 'div.jAOkJc, div.H23r4e',
  generatedTable: 'table, div[role="table"]',
  citationLinks: 'a.PMDqCb, a[href*="linkedin.com/in/"]',
  
  // Cookie consent
  cookieAcceptButton: 'button:has-text("Accept all"), button:has-text("I agree")'
};
