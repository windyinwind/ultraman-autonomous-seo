---
name: seo-render-verify
description: >
  Verifies that SEO meta tags, structured data, and hreflang are correctly
  present in BOTH the raw HTML response (what crawlers/SSR/prerender serve) AND
  the live rendered DOM (what JavaScript produces), and flags any mismatch. Use
  AFTER implementing SEO changes — especially for React/Vue/Angular/Next.js SPAs
  and prerendered/SSG sites where the indexed value can differ from what you
  edited. Prefers the Chrome DevTools MCP. Trigger on: "verify SEO tags", "check
  if meta tags rendered", "confirm structured data", "SEO DevTools check",
  "did my title/keywords actually ship".
---

# SEO Render Verification Skill

**Why this exists.** The value a developer edits in a component is not always the
value Google indexes. There are three different layers and they can disagree:

1. **Raw HTML response** — what `curl` returns. This is what most crawlers, SSR,
   static prerendering, social scrapers, and many AI bots read **first** (they
   don't run JS). For prerendered/SSG sites, *this is what Google indexes.*
2. **Rendered DOM** — what you get after JavaScript executes. Googlebot does
   render, but on a delay; CSR-only tags live only here.
3. **What you edited** — a component, a prerender script, a locale file…

> **Real-world failure this catches:** a site's species pages had their `<title>`
> set in a **prerender script**, while the React component set a *different*
> title client-side. Checking only the DOM would show the React title and look
> fine — but Google indexed the prerendered HTML title. Only a **raw-HTML ↔ DOM
> diff** surfaces this.

So this skill always checks **both layers and diffs them.**

---

## Prerequisites

- A URL to check: a local dev/preview server (`dev_url` from config) or the
  deployed site.
- For the DOM layer, a browser MCP. **Recommended: Chrome DevTools MCP**
  (lighter, no separate browser download in most setups). Playwright MCP also works.

### 🚨 Tool verification
Check whether `chrome-devtools` (preferred) or `playwright` MCP is connected.
- **If neither is connected:** tell the user and offer setup:
  - **Chrome DevTools MCP (recommended):**
    `claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest`
    (or the equivalent `mcpServers` entry for Codex/Gemini/Cursor/Windsurf).
  - You can still do the **raw-HTML layer with `curl` alone** (no browser MCP
    needed) — do that and clearly note the DOM layer was skipped.

---

## Layer A — Raw HTML response (always; needs only curl)

For each page URL, fetch the served HTML and extract the head SEO tags:

```bash
curl -sL "<page_url>" -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
  | grep -ioE '<title>[^<]*</title>|<meta[^>]+(name|property)="(description|robots|og:title|og:description|og:image)"[^>]*>|<link[^>]+rel="(canonical|alternate)"[^>]*>|<html[^>]+lang="[^"]*"' \
  | head -50
```

Also confirm JSON-LD is present in the source:
```bash
curl -sL "<page_url>" | grep -c 'application/ld+json'
```

Record the raw-HTML `<title>`, description, canonical, hreflang set, and JSON-LD
count. **This is the crawler/index-truth baseline.**

---

## Layer B — Rendered DOM (Chrome DevTools MCP preferred)

Navigate and let JS run, then extract the same fields from the live DOM.

**Chrome DevTools MCP tools:** `navigate_page`, `wait_for`, `evaluate_script`,
`take_snapshot`, `take_screenshot`.
**Playwright MCP equivalents:** `browser_navigate`, `browser_wait_for`,
`browser_evaluate`, `browser_take_screenshot`.

1. `navigate_page(url=<page_url>)`
2. Wait for the SPA to hydrate (e.g. `wait_for` text that only appears post-render,
   or a short delay).
3. Run this extraction via `evaluate_script` (Chrome DevTools) /
   `browser_evaluate` (Playwright):

```javascript
() => {
  const get = (sel, attr) => {
    const el = document.querySelector(sel);
    return el ? (attr ? el.getAttribute(attr) : el.textContent?.trim()) : null;
  };
  const getAll = (sel, attr) =>
    [...document.querySelectorAll(sel)].map(el => attr ? el.getAttribute(attr) : el.textContent?.trim());
  let structuredData = [];
  try {
    structuredData = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map(s => JSON.parse(s.textContent));
  } catch (e) { structuredData = ['PARSE_ERROR: ' + e.message]; }
  return {
    title: document.title,
    canonical: get('link[rel="canonical"]', 'href'),
    description: get('meta[name="description"]', 'content'),
    robots: get('meta[name="robots"]', 'content'),
    ogTitle: get('meta[property="og:title"]', 'content'),
    ogImage: get('meta[property="og:image"]', 'content'),
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    h1Count: document.querySelectorAll('h1').length,
    h1Text: get('h1'),
    hreflang: getAll('link[rel="alternate"][hreflang]', 'hreflang'),
    structuredDataTypes: structuredData.flat().map(d => d && d['@type']).filter(Boolean),
    ldJsonCount: document.querySelectorAll('script[type="application/ld+json"]').length,
  };
}
```

---

## Step C — Diff the two layers (the important part)

| Field | Raw HTML (curl) | Rendered DOM | Match? | Verdict |
|-------|-----------------|--------------|--------|---------|
| `<title>` | … | … | ✅/❌ | If different → decide which Google indexes (prerendered/SSG → raw HTML wins) and fix that layer |
| description | … | … | ✅/❌ | |
| canonical | … | … | ✅/❌ | |
| hreflang count | … | … | ✅/❌ | |
| JSON-LD count/types | … | … | ✅/❌ | |

**Interpretation:**
- **Tag present in DOM but missing from raw HTML** → it's injected only by client
  JS. Crawlers that don't render (and the first-pass index) miss it. For a
  prerendered/SSG site this means your edit didn't reach the prerender step — fix
  the prerender script / build, not just the component.
- **Tag differs between raw HTML and DOM** → two sources of truth are fighting
  (e.g. a prerender template vs a runtime `useEffect`). Make them agree; the
  prerendered value is usually the one indexed.
- **Tag present in raw HTML and DOM and equal** → ✅ shipped correctly.

---

## Step D — Validate values (per page)

- **Title:** contains the target keyword; 30–60 chars; unique per page; not the
  `index.html` placeholder.
- **Description:** 120–160 chars; contains the keyword naturally; unique.
- **Canonical:** exactly the page URL (trailing-slash consistent); localized
  pages self-canonical to their localized URL.
- **Hreflang:** only if `supported_languages > 1` — expect `N` language tags + 1
  `x-default` (`N + 1` total); every locale references all others.
- **JSON-LD:** correct `@type` per page; valid JSON; describes visible content
  only. Validate at <https://search.google.com/test/rich-results>.
- **One `<h1>`**; `lang`/`dir` correct (`rtl` only for Arabic etc.).

| Page | Expected @type(s) |
|------|------------------|
| Homepage | `SoftwareApplication`, `WebSite`, `Organization` |
| FAQ | `FAQPage` |
| How-to | `HowTo` |
| Article / content | `Article`, `BreadcrumbList` |
| Product | `Product` (+ real `AggregateRating`/`Review` only if genuine) |

---

## Step E — Report

```markdown
## SEO Render Verification — [date]
### [URL]
| Field | Raw HTML | DOM | Match | Notes |
|-------|----------|-----|-------|-------|
| title | … | … | ✅/❌ | |
| description (len) | … | … | ✅/❌ | |
| canonical | … | … | ✅/❌ | |
| hreflang count | N+1 | … | ✅/❌ | |
| JSON-LD @types | […] | […] | ✅/❌ | |
| h1 count | 1 | … | ✅/❌ | |

**Layer mismatches:** …
**Action items:** …
```

Optionally `take_screenshot` of the rendered page for a visual record.

---

## Common SPA / prerender issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Title in DOM but not in raw HTML | Set only by client JS (`useEffect`) | Add/repair prerendering (SSG/SSR) so the tag is in the served HTML |
| Raw HTML title ≠ DOM title | Prerender template vs runtime setter disagree | Make both produce the same value; prerendered value is indexed |
| `keywords`/meta "not showing up" after edit | Edited the component but the build prerenders from a separate script/data file | Find the prerender/build source of truth and edit there; rebuild |
| JSON-LD empty | Serialization error | `JSON.stringify`, no circular refs |
| `lang` wrong | i18n not ready before tags set | Set lang at router level / in the prerender |

---

## References
- [Google: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: Rich Results Test](https://search.google.com/test/rich-results)
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)
