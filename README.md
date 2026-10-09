# Standalone Talent Sourcing Agent (Google Search AI Mode `udm=50`)

A dedicated, standalone intelligence agent built **exclusively for Google Search AI Mode**.

It executes your executive talent sourcing prompt directly on Google's new conversational search engine with real-time web query fan-out grounding, returning all verified contacts, LinkedIn profile URLs, emails, and phone numbers in **pure JSON format directly in your terminal**.

---

## ⚡ The Discovery: `udm=50`

Google Search's dedicated **AI Mode** is triggered by passing the URL parameter **`udm=50`**:
```http
https://www.google.com/search?q={ENCODED_PROMPT}&udm=50
```

When triggered:
1. Google loads the dedicated interactive conversational canvas.
2. The search backend automatically performs query fan-out (searching parallel sub-topics across public LinkedIn profiles, company directories, official press releases, and team pages).
3. Google Gemini synthesizes the findings into the requested structured format.

---

## 🚀 How to Run in the Terminal (JSON Output)

### 1. Terminal JSON Execution (via Free Google AI Studio Key)
Run directly from your terminal by passing `--key` or setting `$env:GEMINI_API_KEY`:
```powershell
node standalone-talent-sourcer/cli.mjs "Sapient Wealth" --key="YOUR_GEMINI_API_KEY"
```
Or set it once in your environment:
```powershell
$env:GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
node standalone-talent-sourcer/cli.mjs "Sapient Wealth"
```

*(Note: Free Google Gemini API keys include 1,500 live grounded searches per day with zero CAPTCHA at https://aistudio.google.com/app/apikey)*

---

## 📋 Structured JSON Output Schema

The tool outputs a clean, parseable JSON payload directly to `stdout`:

```json
{
  "company": "Sapient Wealth",
  "totalContacts": 3,
  "contacts": [
    {
      "fullName": "Amit Bivalkar",
      "currentTitle": "Founder & Director",
      "company": "Sapient Wealth",
      "linkedinUrl": "https://www.linkedin.com/in/amit-bivalkar-0664084",
      "publicEmail": "accounts3.0@sapientwealth.co.in",
      "publicPhone": "+91 20 25250100",
      "sourceUrl": "https://sapientwealth.co.in/about"
    },
    {
      "fullName": "Dhruv Mehta",
      "currentTitle": "Chairman",
      "company": "Sapient Wealth",
      "linkedinUrl": "https://www.linkedin.com/in/dhruv-mehta",
      "publicEmail": "dhruv@sapientwealth.co.in",
      "publicPhone": "+91 22 4011 1950",
      "sourceUrl": "https://sapientwealth.co.in"
    },
    {
      "fullName": "Bhavik Shah",
      "currentTitle": "HRBP & Talent Acquisition",
      "company": "Sapient Wealth",
      "linkedinUrl": "https://www.linkedin.com/in/bhavik-shah",
      "publicEmail": "support@sapientfinserv.com",
      "publicPhone": "+91 22 4474 1992",
      "sourceUrl": "https://in.linkedin.com/in/bhavik-shah"
    }
  ],
  "sources": [
    {
      "title": "Sapient Wealth Official Website",
      "uri": "https://sapientwealth.co.in"
    },
    {
      "title": "Amit Bivalkar - LinkedIn",
      "uri": "https://www.linkedin.com/in/amit-bivalkar-0664084"
    }
  ],
  "searchQueriesRan": [
    "Sapient Wealth founders CEO leadership",
    "Sapient Wealth talent acquisition HR recruitment LinkedIn"
  ]
}
```

---

## 🧪 Testing

To run the automated test suite:
```powershell
node --test standalone-talent-sourcer/test/sourcer.test.mjs
```
