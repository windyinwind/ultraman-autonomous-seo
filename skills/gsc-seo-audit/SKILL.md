---
name: gsc-seo-audit
description: >
  Full Google Search Console SEO audit and optimization workflow. Activate when
  the user asks to "audit SEO", "optimize SEO from Search Console", "fix my rankings",
  "check GSC data", or "improve search performance". Covers the complete 4-step
  workflow: (1) Pull GSC data, (2) Analyze using Google's official guidelines,
  (3) Create a git branch and implement fixes, (4) Verify in Chrome DevTools.
---

# GSC SEO Audit & Optimization Skill

This skill implements a **4-step, Google-recommended SEO optimization workflow** using real Search Console data. Always follow these steps in order.

---

## Step 0: Read Plugin Configuration

The plugin supports **two-level configuration**: a global default and a project-level override.
Always load in this priority order:

### Priority 1: Project-local config (highest priority)
Look for `.seo-config.json` in the **current working directory** (the project root):
```
<project_root>/.seo-config.json
```

### Priority 2: Global plugin config (fallback)
Fall back to the global config at:
```
~/.gemini/config/plugins/seo-optimizer/config.json
```

### Priority 3: Ask the user (if neither exists)
If no config is found, ask the user for:
- `site_url` — the GSC property URL (e.g. `https://mysite.com/`)
- `repo_path` — absolute path to the website repository

Then offer to create `.seo-config.json` in the project root for future use.

### Config Fields Reference
| Field | Required | Description |
|-------|----------|-------------|
| `site_url` | ✅ | Exact GSC property URL including trailing slash |
| `repo_path` | ✅ | Absolute path to website repo |
| `gcp_credentials_path` | ❌ | Path to GCP service account JSON (if using service account auth) |
| `supported_languages` | ❌ | List of locale codes for hreflang verification |
| `key_pages` | ❌ | Pages to always run DevTools verification on |
| `build_command` | ❌ | Build command (default: `npm run build`) |
| `dev_command` | ❌ | Dev server command (default: `npm run dev`) |
| `dev_url` | ❌ | Local dev URL (default: `http://localhost:5173`) |
| `sitemap_script` | ❌ | Path to sitemap generation script |

**Example `.seo-config.json` for a new project:**
```json
{
  "site_url": "https://mysite.com/",
  "repo_path": "/Users/me/Code/my-project",
  "build_command": "npm run build",
  "dev_url": "http://localhost:3000",
  "supported_languages": ["en", "ja"]
}
```

---

## Step 1: Pull GSC Data (Using search-console MCP)

Pull the following data **in parallel** using the `search-console` MCP:

### 1a. Performance Summary (28d)
```
get_performance_summary(site_url=<site_url>, period="28d")
```
- Note: clicks, impressions, CTR, avg position, and comparison with previous period
- Record the **delta_pct** — any metric declining >20% is a priority

### 1b. Top Queries (90 days for trend)
```
get_search_analytics(site_url=<site_url>, dimensions=["query"], row_limit=100, start_date="90 days ago")
```
Classify queries into opportunity tiers:
| Tier | Criteria | Action |
|------|----------|--------|
| 🔴 **Critical** | Position 1–10, CTR < 2% | Title/description optimization |
| 🟡 **High** | Position 4–15, High impressions, 0 clicks | Structured data, content gap |
| 🟢 **Growth** | Position 11–20, trending up | Internal linking, content refresh |

### 1c. Top Pages (by impressions)
```
get_search_analytics(site_url=<site_url>, dimensions=["page"], row_limit=50)
```
Identify:
- Pages with high impressions but 0 clicks → CTR optimization needed
- Pages with no impressions → indexing or content problem

### 1d. Country Breakdown
```
get_search_analytics(site_url=<site_url>, dimensions=["country"], row_limit=20)
```
- Top countries drive i18n/hreflang priority
- If a country has high impressions but low CTR → locale-specific title optimization

### 1e. Sitemap Health
```
list_sitemaps(site_url=<site_url>)
```
Check for:
- `indexed` vs `submitted` ratio — below 50% is a red flag
- `isPending` — if true, sitemap was recently submitted and processing

### 1f. URL Inspection (Key Pages)
```
inspect_url(site_url=<site_url>, url=<homepage>)
inspect_url(site_url=<site_url>, url=<top_page_from_1c>)
```
Verify:
- `verdict: PASS` — page is indexed
- `crawledAs: MOBILE` — Google uses mobile-first indexing (required)
- `richResultsResult.verdict` — `PASS` means structured data is valid
- `mobileUsabilityResult.verdict` — `VERDICT_UNSPECIFIED` is a warning to investigate

---

## Step 2: Analyze Against Google's Official Guidelines

After collecting data, perform this analysis using Google's recommendations:

### 2a. CTR Optimization (Google: title & description matter most)
For each 🔴 Critical query:
1. Check if the **page title** contains the query keyword
2. Check if the **meta description** is compelling and under 160 characters
3. Check if the page has **structured data** that could generate rich results
4. Action: Update `<title>`, `<meta name="description">`, add relevant JSON-LD

### 2b. Structured Data Audit (Google: JSON-LD preferred)
Per page type, verify the correct schema is present (Google's priority list):

| Page Type | Required Schema | Eligibility |
|-----------|----------------|-------------|
| Homepage | `SoftwareApplication` + `WebSite` + `Organization` | App install card, SearchAction |
| FAQ page | `FAQPage` | Accordion rich result |
| How-to page | `HowTo` | Step-by-step rich result |
| Article/Blog | `Article` + `BreadcrumbList` | Article card with image |
| Product page | `Product` + `Review` + `AggregateRating` | Product rich result |
| Event page | `Event` | Event card |
| Local business | `LocalBusiness` | Business panel |

**Google Rule:** Structured data must describe content **visible on the page**. Never add schemas for content that isn't shown.

### 2c. Hreflang Audit (Google: required for multilingual sites)
Verify the sitemap has `<xhtml:link rel="alternate">` tags for every language:
- Every language version must reference all other language versions
- Must include `hreflang="x-default"` pointing to the canonical/English version
- Language codes must be valid BCP 47 (e.g., `en`, `ja`, `zh`, `ar`)

### 2d. Indexing Issues
- If `indexed / submitted < 50%` in sitemap → investigate with `inspect_url` on non-indexed pages
- If `verdict = FAIL` → check `coverageState` for reason (soft 404, redirect, noindex, etc.)
- Common fixes: remove `noindex` tags, fix canonical mismatches, fix thin content

### 2e. Mobile Usability
- Google uses **mobile-first indexing** — all pages must pass mobile usability
- Check: viewport meta tag, font sizes ≥ 12px, no horizontal scroll, tap targets ≥ 48px

---

## Step 3: Create Git Branch and Implement Fixes

**ALWAYS work in a branch. Never commit SEO changes directly to `main`.**

```bash
# 1. Create a descriptive SEO branch
git checkout -b seo/gsc-audit-$(date +%Y-%m-%d)

# 2. Make all changes (per Step 2 analysis)
# 3. Rebuild/regenerate any static files (sitemap, prerendered HTML)
npm run build   # or equivalent

# 4. Verify no build errors

# 5. Commit with structured message
git commit -m "seo: GSC audit optimizations [YYYY-MM-DD]

Changes:
- <list specific changes>"
```

### Fix Priority Order (highest ROI first):
1. **Remove `noindex` from indexable pages** — immediate impact
2. **Add/fix structured data** — rich results within 1–2 weeks
3. **Fix page titles for high-impression/low-CTR pages** — CTR improvement within days
4. **Fix meta descriptions** — CTR improvement
5. **Fix sitemap** (remove 404 URLs, add missing hreflang) — crawl efficiency
6. **Fix mobile usability issues** — ranking signal

### DO NOT change on `main` directly:
- Never push SEO experiments directly to production
- Always create a branch, verify with Chrome DevTools (Step 4), then merge

---

## Step 4: Verify Rendered Output with Chrome DevTools

After building, verify that all SEO tags are **actually rendered in the DOM** — especially important for React/Vue/Angular SPAs where meta tags are set via JavaScript.

**Invoke the `seo-render-verify` skill** with the list of pages and expected tags.

See [seo-render-verify/SKILL.md](../seo-render-verify/SKILL.md) for full instructions.

Quick checklist:
- [ ] `<title>` matches expected value
- [ ] `<meta name="description">` contains keyword
- [ ] `<link rel="canonical">` points to correct URL
- [ ] `<link rel="alternate" hreflang="...">` present for all languages
- [ ] `<script type="application/ld+json">` contains valid JSON
- [ ] Structured data validates at https://search.google.com/test/rich-results

---

## Step 5: Merge and Request Re-indexing

After Chrome DevTools verification passes:

```bash
# Merge to main
git checkout main
git merge seo/gsc-audit-$(date +%Y-%m-%d)
git push origin main

# Request indexing for high-priority pages via GSC
# Use: inspect_url → then manually trigger "Request Indexing" in GSC UI
# Or use GSC API: POST to indexing API (if configured)
```

After deployment:
1. Go to GSC → URL Inspection → paste each changed URL → "Request Indexing"
2. Check back in GSC after 48–72 hours for indexing status
3. Monitor CTR changes in 7–14 days using `get_performance_summary`

---

## Common Anti-Patterns to Avoid

❌ **Don't** add structured data for content not visible on page  
❌ **Don't** use the same title/description on multiple pages (duplicate content)  
❌ **Don't** set `noindex` on pages with thin content without first improving the content  
❌ **Don't** add `keywords` meta tag — Google ignores it  
❌ **Don't** stuff keywords into title — keep titles natural and under 60 chars  
❌ **Don't** add fake reviews or ratings to structured data  
❌ **Don't** use multiple `<h1>` tags per page  
❌ **Don't** push SEO changes directly to `main` without verification  

---

## References
- [Google Search Central — Structured Data Guidelines](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Full Reference](https://schema.org)
- [Google Search Console API Docs](https://developers.google.com/webmaster-tools)
- [Hreflang Guidelines](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Mobile-First Indexing Guidelines](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing)
