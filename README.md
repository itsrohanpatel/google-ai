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
3. Google Gemini synthesizes the findings into structured data.

---

## 🚀 How to Run

### Method 1: Local Chrome CDP (100% Free, No API Key Required)
If you have Google Chrome open with remote debugging (`--remote-debugging-port=9222`):
```powershell
node cli.mjs "Sapient Wealth"
```
The CLI automatically hooks into your local Chrome browser via WebSocket, runs the search in Google AI Mode, and extracts the results.

### Method 2: Google Gemini Search Grounding API
Run directly from your terminal by passing `--key` or setting `$env:GEMINI_API_KEY`:
```powershell
node cli.mjs "Sapient Wealth" --key="YOUR_GEMINI_API_KEY"
```
Or set it once in your environment:
```powershell
$env:GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
node cli.mjs "Sapient Wealth"
```
*(Note: Free Google Gemini API keys include 1,500 live grounded searches per day with zero CAPTCHA at https://aistudio.google.com/app/apikey)*

---

## 🤖 Running in GitHub Actions

You can run talent sourcing directly inside GitHub Actions without touching a local terminal:

1. Go to your repository on GitHub: `https://github.com/itsrohanpatel/google-ai`
2. Click on the **Actions** tab.
3. Select the **Source Talent Intelligence** workflow on the left sidebar.
4. Click **Run workflow**, enter any company name (e.g., `Sapient Wealth`), and click the green button.
5. Once complete, the job summary displays an interactive markdown table of all identified executives, roles, and LinkedIn links, and provides the raw `result.json` download.

*(Optional)*: To enable API fallback in GitHub Actions when Chrome encounters cloud datacenter CAPTCHAs, add `GEMINI_API_KEY` to **Settings > Secrets and variables > Actions > Repository secrets**.

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
      "publicEmail": "Not publicly disclosed",
      "publicPhone": "Not publicly disclosed",
      "sourceUrl": "https://in.linkedin.com/in/amit-bivalkar-0664084"
    },
    {
      "fullName": "Dhruv Mehta",
      "currentTitle": "Chairman",
      "company": "Sapient Wealth",
      "linkedinUrl": "https://www.linkedin.com/in/dhruv-mehta",
      "publicEmail": "Not publicly disclosed",
      "publicPhone": "Not publicly disclosed",
      "sourceUrl": "https://in.linkedin.com/in/dhruv-mehta"
    },
    {
      "fullName": "Bhavik Shah",
      "currentTitle": "HRBP & Talent Acquisition",
      "company": "Sapient Wealth",
      "linkedinUrl": "https://www.linkedin.com/in/bhavik-shah",
      "publicEmail": "Not publicly disclosed",
      "publicPhone": "Not publicly disclosed",
      "sourceUrl": "https://in.linkedin.com/in/bhavik-shah"
    }
  ],
  "sources": [
    {
      "title": "Sapient Wealth Official Website",
      "uri": "https://sapientwealth.co.in"
    }
  ]
}
```

---

## 🧪 Testing

To run the automated test suite:
```powershell
npm test
```
