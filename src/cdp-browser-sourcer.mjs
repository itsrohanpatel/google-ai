/**
 * Google AI Mode (udm=50) Direct Chrome CDP Extractor
 * Connects to Google Chrome via Chrome DevTools Protocol (ws://localhost:9222)
 * Reads the live Google AI Mode response, extracts all LinkedIn URLs, executive titles,
 * contact details, and returns structured JSON directly in the terminal.
 */

import { buildGoogleAIModeUrl } from './google-ai-mode-url.mjs';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sendCdpCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) {
            reject(new Error(data.error.message));
          } else {
            resolve(data.result);
          }
        }
      } catch (err) {
        // ignore non-json
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

export async function isChromeCdpAvailable(port = 9222) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch (_) {
    return false;
  }
}

function matchLinkedinUrl(name, linkedinLinks) {
  if (!name || !linkedinLinks || !linkedinLinks.length) return 'Not publicly disclosed';
  const clean = name.toLowerCase().replace(/^(shri|smt|dr\.|mr\.|ms\.)\s*/i, '').replace(/[^a-z0-9\s]/g, '').trim();
  const tokens = clean.split(/\s+/).filter(t => t.length > 2);
  if (!tokens.length) return 'Not publicly disclosed';

  // 1. Direct slug match (e.g. dax-bamania in /in/dax-bamania)
  const fullSlug = tokens.join('-');
  const slugMatch = linkedinLinks.find(l => l.href.toLowerCase().includes(fullSlug));
  if (slugMatch) return slugMatch.href.split('?')[0];

  // 2. Multi-token match in href (first and last name)
  if (tokens.length >= 2) {
    const first = tokens[0];
    const last = tokens[tokens.length - 1];
    const firstLastMatch = linkedinLinks.find(l => {
      const h = l.href.toLowerCase();
      return h.includes(first) && h.includes(last);
    });
    if (firstLastMatch) return firstLastMatch.href.split('?')[0];
  }

  // 3. Anchor text matches name
  const textMatch = linkedinLinks.find(l => l.text && l.text.toLowerCase().includes(clean));
  if (textMatch) return textMatch.href.split('?')[0];

  return 'Not publicly disclosed';
}

export async function sourceWithLiveChromeAiMode(companyName, port = 9222) {
  const query = `${companyName} founders CEO HR talent acquisition leadership`;
  const aiModeUrl = buildGoogleAIModeUrl(query);

  // 1. Get list of active tabs from Chrome
  const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
  const pages = await listRes.json();

  // Find if a tab for this company or search is already open
  const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '+');
  let targetPage = pages.find(p => p.url && (p.url.toLowerCase().includes(companySlug) || p.url.toLowerCase().includes(encodeURIComponent(companyName.toLowerCase()))));

  if (!targetPage) {
    // Open a new tab in Chrome running Google AI Mode
    const newTabRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(aiModeUrl)}`, { method: 'PUT' });
    targetPage = await newTabRes.json();
    await sleep(6000);
  }

  if (!targetPage || !targetPage.webSocketDebuggerUrl) {
    throw new Error('Could not attach to Chrome tab via WebSocket debugger URL.');
  }

  const ws = new WebSocket(targetPage.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  try {
    // 2. Wait up to 10 seconds for AI response to finish streaming
    let fullText = '';
    for (let attempt = 0; attempt < 8; attempt++) {
      const evalRes = await sendCdpCommand(ws, 'Runtime.evaluate', {
        expression: 'document.body.innerText',
        returnByValue: true
      });
      fullText = evalRes?.result?.value || '';
      if (fullText.includes('Founders') || fullText.includes('Leadership') || fullText.includes('Director') || fullText.includes('Human Resources') || fullText.includes('Talent Acquisition') || fullText.includes('CEO')) {
        break;
      }
      await sleep(1500);
    }

    // 3. Extract all links and anchors from the AI page
    const linksRes = await sendCdpCommand(ws, 'Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.innerText.trim(),
          href: a.href
        })).filter(a => a.href && (a.href.includes('linkedin.com/in/') || a.href.includes('linkedin.com/posts/') || a.href.includes('http')))
      `,
      returnByValue: true
    });

    const links = linksRes?.result?.value || [];
    const linkedinProfileLinks = links.filter(l => l.href.includes('linkedin.com/in/'));

    // 4. Parse text lines into executive contacts
    const contacts = [];
    const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

    const nonPersonHeaders = [
      'ai mode conversation',
      'co-founders & directors',
      'founders & core executive leadership',
      'founders & key executive leadership',
      'human resources & talent acquisition',
      'hr & talent acquisition leadership',
      'franchise & delivery leadership',
      'delivery leadership',
      'franchise leadership',
      'leadership',
      'note'
    ];

    const roleRegex = /(founder|co-founder|chairman|director|ceo|president|managing director|hr|talent|recruiter|human resources|manager|chief|hrbp|head)/i;

    for (const line of lines) {
      if (line.includes(':')) {
        const [leftPart, rightPart] = line.split(':').map(s => s.trim());
        const lowerLeft = leftPart.toLowerCase().replace(/^(👥|👔|•|-|\*)\s*/, '').trim();

        if (lowerLeft && lowerLeft.length < 50 && !nonPersonHeaders.some(h => lowerLeft.startsWith(h)) && !lowerLeft.includes('http')) {
          let cleanName = '';
          let cleanRole = '';
          let descText = rightPart || '';

          // Pattern A: "Name (Role): Description" e.g. "Dax Bamania (Co-Founder & CEO): Drives corporate strategy..."
          const parenMatch = leftPart.match(/^([^(]+)\(([^)]+)\)/);
          if (parenMatch && roleRegex.test(parenMatch[2])) {
            cleanName = parenMatch[1].replace(/^(👥|👔|•|-|\*)\s*/, '').trim();
            cleanRole = parenMatch[2].trim();
          }
          // Pattern B: "Role: Name" e.g. "Founder: Shri Govindbhai C. Patel", "Managing Director & CEO: Shri Shekharbhai G. Patel"
          else if (roleRegex.test(lowerLeft) && rightPart) {
            cleanRole = leftPart.replace(/^(👥|👔|•|-|\*)\s*/, '').trim();
            const sentenceMatch = rightPart.match(/^([^.]+?(?:\s+[A-Z]\.)?\s+[A-Za-z]+)(?:\.|\s+He|\s+She|\s+is|\s+was|\s+has)/i);
            cleanName = sentenceMatch ? sentenceMatch[1].trim() : rightPart.split(/\.\s+[A-Z]/)[0].trim();
          } 
          // Pattern C: "Name: Role" e.g. "Amit Bivalkar: Founder and Director"
          else if (rightPart && roleRegex.test(rightPart)) {
            cleanName = leftPart.replace(/^(👥|👔|•|-|\*)\s*/, '').trim();
            cleanRole = rightPart.split('.')[0].trim();
          }

          if (cleanName && cleanName.length > 2 && cleanName.length < 40 && !cleanName.includes('http')) {
            const linkedinUrl = matchLinkedinUrl(cleanName, linkedinProfileLinks);

            // Look for email or phone in description
            const emailMatch = descText ? descText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) : null;
            const phoneMatch = descText ? descText.match(/(?:\+91|91)?[\s-]?[6789]\d{9}|(?:\+1)?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/) : null;

            contacts.push({
              fullName: cleanName,
              currentTitle: cleanRole,
              company: companyName,
              linkedinUrl,
              publicEmail: emailMatch ? emailMatch[0] : 'Not publicly disclosed',
              publicPhone: phoneMatch ? phoneMatch[0] : 'Not publicly disclosed',
              sourceUrl: linkedinUrl !== 'Not publicly disclosed' ? linkedinUrl : targetPage.url
            });
          }
        }
      }
    }

    // 5. Extract grouped Co-Founders / Directors
    const coFoundersLine = lines.find(l => l.includes('Co-Founders') || l.includes('include'));
    if (coFoundersLine) {
      const namesPart = coFoundersLine.split(/includes|include|are/i)[1];
      if (namesPart) {
        const individualNames = namesPart.split(/,|and/).map(n => n.replace(/\.$/, '').trim()).filter(n => n.length > 3 && n.length < 30);
        for (const name of individualNames) {
          if (!contacts.some(c => c.fullName.toLowerCase() === name.toLowerCase())) {
            const linkedinUrl = matchLinkedinUrl(name, linkedinProfileLinks);
            contacts.push({
              fullName: name,
              currentTitle: 'Co-Founder & Director',
              company: companyName,
              linkedinUrl,
              publicEmail: 'Not publicly disclosed',
              publicPhone: 'Not publicly disclosed',
              sourceUrl: linkedinUrl !== 'Not publicly disclosed' ? linkedinUrl : targetPage.url
            });
          }
        }
      }
    }

    // 6. Check for individual LinkedIn profile links discovered on the page
    for (const l of linkedinProfileLinks) {
      const slugMatch = l.href.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
      if (slugMatch) {
        const slug = slugMatch[1].replace(/-\d+$/, '').replace(/-/g, ' ');
        const formattedName = slug.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (!contacts.some(c => c.fullName.toLowerCase().includes(formattedName.toLowerCase()) || formattedName.toLowerCase().includes(c.fullName.toLowerCase())) && formattedName.length > 4) {
          const matchingLine = lines.find(line => line.toLowerCase().includes(formattedName.toLowerCase()));
          if (matchingLine) {
            contacts.push({
              fullName: formattedName,
              currentTitle: l.text || 'Executive Leadership',
              company: companyName,
              linkedinUrl: l.href.split('?')[0],
              publicEmail: 'Not publicly disclosed',
              publicPhone: 'Not publicly disclosed',
              sourceUrl: l.href.split('?')[0]
            });
          }
        }
      }
    }

    return {
      company: companyName,
      totalContacts: contacts.length,
      contacts,
      aiOverviewSummary: fullText.slice(0, 1000),
      sourcePageUrl: targetPage.url
    };
  } finally {
    ws.close();
  }
}
