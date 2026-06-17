---
name: seo-render-verify
description: >
  Verifies that SEO meta tags, structured data, and hreflang attributes are
  correctly rendered in the browser DOM after JavaScript execution. Use AFTER
  implementing SEO changes, especially for React/Vue/Angular/Next.js SPAs where
  tags are injected dynamically. Uses Chrome DevTools MCP to inspect live DOM.
  Trigger on: "verify SEO tags", "check if meta tags rendered", "confirm structured
  data in DOM", "SEO DevTools check", "inspect rendered head tags".
---

# SEO Render Verification Skill

**Purpose:** Single-page applications (React, Vue, Next.js) inject `<title>`, `<meta>`, and `<script type="application/ld+json">` via JavaScript at runtime. The HTML source may show placeholder values while the rendered DOM shows the correct values — or vice versa. This skill uses Chrome DevTools to verify the **live rendered DOM**, not the HTML source.

---

## Prerequisites

- Chrome DevTools MCP must be configured and running
- The site must be accessible at a URL (localhost dev server or deployed URL)
- Read [chrome-devtools/SKILL.md](../../../chrome-devtools-plugin/skills/chrome-devtools/SKILL.md) for base Chrome DevTools patterns

---

## Step 1: Navigate to the Page

```
browser_navigate(url=<page_url>)
```

Wait for full JS execution:
```
browser_wait_for(selector="head title", timeout=5000)
```

For React apps, also wait for the app root to be populated:
```
browser_wait_for(selector="#root > *", timeout=5000)
```

---

## Step 2: Extract and Verify All SEO Tags

Use a single `browser_evaluate` call to extract all critical SEO data from the rendered DOM:

```javascript
// Run this in browser_evaluate
(() => {
  const get = (sel, attr) => {
    const el = document.querySelector(sel);
    return el ? (attr ? el.getAttribute(attr) : el.textContent?.trim()) : null;
  };
  const getAll = (sel, attr) =>
    [...document.querySelectorAll(sel)].map(el => attr ? el.getAttribute(attr) : el.textContent?.trim());

  // Extract structured data
  let structuredData = [];
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    structuredData = [...scripts].map(s => JSON.parse(s.textContent));
  } catch(e) { structuredData = ['PARSE_ERROR: ' + e.message]; }

  return {
    title: document.title,
    canonical: get('link[rel="canonical"]', 'href'),
    description: get('meta[name="description"]', 'content'),
    robots: get('meta[name="robots"]', 'content'),
    ogTitle: get('meta[property="og:title"]', 'content'),
    ogDescription: get('meta[property="og:description"]', 'content'),
    ogImage: get('meta[property="og:image"]', 'content'),
    twitterCard: get('meta[name="twitter:card"]', 'content'),
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    h1Count: document.querySelectorAll('h1').length,
    h1Text: get('h1'),
    hreflang: getAll('link[rel="alternate"][hreflang]', 'hreflang'),
    hreflangUrls: getAll('link[rel="alternate"][hreflang]', 'href'),
    structuredData,
  };
})()
```

---

## Step 3: Validate Each Critical Element

For each value returned, verify against the expected values:

### ✅ Title Tag
- **Must contain** the primary keyword for the page
- **Length:** 30–60 characters (truncated at ~580px in Google)
- **Must NOT be** the same as other pages (duplicate titles hurt rankings)
- **React SPA note:** If title shows the `index.html` placeholder instead of the page-specific title, the Seo component's `useEffect` hasn't fired — check for hydration errors

### ✅ Meta Description
- **Length:** 120–160 characters (longer is truncated)
- **Must contain** the target keyword naturally
- **Must be unique** per page
- If `null` → Google will auto-generate from page content (not ideal)

### ✅ Canonical URL
- **Must match** the current page URL exactly (including/excluding trailing slash consistently)
- If canonical points to a different URL → Google will index the canonical, not this page
- For localized pages: `<site_url>/<lang>/path` must have canonical `<site_url>/<lang>/path`

### ✅ Hreflang Links
- **Only required if `supported_languages` count is greater than 1.** Single-language sites do not need hreflang tags.
- **Must include ALL supported languages** (not just some) as specified in `supported_languages` configuration.
- **Must include `x-default`** pointing to the canonical/primary language URL.
- Count check: if `N` languages are supported, expect `N` language alternate tags + 1 `x-default` tag (a total of `N + 1` tags).
- If count < expected → some locales are missing.

### ✅ Structured Data (JSON-LD)
Verify the correct `@type` is present for each page:

```javascript
// Check for a specific @type in structuredData array
const hasType = (type) => structuredData.some(d => 
  d['@type'] === type || (Array.isArray(d) && d.some(item => item['@type'] === type))
);
```

| Page | Expected @type(s) |
|------|------------------|
| Homepage | `SoftwareApplication`, `WebSite`, `Organization` |
| FAQ | `FAQPage` |
| How-to | `HowTo` |
| Article/Creature | `Article`, `BreadcrumbList` |
| Sketch-Ocean | `BreadcrumbList`, `WebPage` |

### ✅ Single H1
- `h1Count` must be exactly `1`
- Multiple H1s confuse Google's content hierarchy
- `h1Text` should contain the primary keyword

### ✅ Language and Direction
- `lang` attribute must match the locale (`en`, `ja`, `ar`, etc.)
- `dir` must be `rtl` for Arabic, `ltr` for all others

---

## Step 4: Navigate Through Key Pages Systematically

For a full site audit, check these pages in order:

```
1. Homepage          → / or /[lang]/
2. Key landing page  → /sketch-ocean or /draw-fish-app
3. FAQ page          → /faq
4. Content page      → /sea-secrets/[slug] (pick a top-impression creature)
5. Localized version → /ja/ or /ar/ (check RTL for Arabic)
```

For each page, run the Step 2 JS extraction and compare against expected values.

---

## Step 5: Take a Screenshot for Documentation

After verification, take a screenshot of the browser's DevTools "Elements" panel showing the `<head>` section:

```
browser_take_screenshot()
```

This creates a visual record of the rendered tags for future comparison.

---

## Step 6: Report Results

Create a verification report with:

```markdown
## SEO Render Verification Report — [Date]

### Page: [URL]
| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Title | "..." | "..." | ✅/❌ |
| Description length | 120-160 chars | X chars | ✅/❌ |
| Canonical | https://... | https://... | ✅/❌ |
| Hreflang count | 12 | X | ✅/❌ |
| Structured data @types | [...] | [...] | ✅/❌ |
| H1 count | 1 | X | ✅/❌ |
| lang attribute | en | en | ✅/❌ |

### Issues Found
- [ ] Issue 1: ...
- [ ] Issue 2: ...

### Passed
- [x] All hreflang tags present
- [x] Structured data valid JSON
```

---

## Common Issues in React/Next.js SPAs

| Symptom | Cause | Fix |
|---------|-------|-----|
| Title shows index.html default value | `useEffect` SEO hook not firing | Check component mounting, add prerender step |
| Hreflang missing in DOM but in source | SSR vs CSR mismatch | Ensure tags are in prerendered HTML |
| `<script type="application/ld+json">` empty | JSON serialization error | Check for circular references, use `JSON.stringify()` |
| `lang` attribute wrong | `i18n` not initialized before Seo component | Move lang setter to router-level |
| Description truncated in Google | > 160 characters in content | Trim to 155 chars max |

---

## Quick Validation Command

For fast single-page checks, use this minimal command in `browser_evaluate`:
```javascript
({
  title: document.title,
  desc: document.querySelector('meta[name="description"]')?.content?.length + ' chars',
  canonical: document.querySelector('link[rel="canonical"]')?.href,
  ldJson: document.querySelectorAll('script[type="application/ld+json"]').length + ' scripts',
  hreflang: document.querySelectorAll('link[rel="alternate"]').length + ' links',
  h1: document.querySelectorAll('h1').length,
})
```

---

## References
- [Google: Understand JavaScript SEO Basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: Rich Results Test](https://search.google.com/test/rich-results)
- [Chrome DevTools: Elements Panel](https://developer.chrome.com/docs/devtools/elements/)
