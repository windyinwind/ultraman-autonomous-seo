# SEO Optimizer Plugin — Agent Rules

## Core Rules (Always Apply)

1. **ALWAYS create a git branch before making any SEO code changes.**  
   Never commit SEO changes directly to `main`. Use the `seo-branch-workflow` skill.

2. **ALWAYS verify BOTH the raw HTML response and the rendered DOM after changes.**  
   HTML source ≠ rendered DOM ≠ what Google indexes. Check the served HTML
   (`curl`) AND the live DOM (Chrome DevTools MCP preferred, Playwright fallback)
   and **diff them** using the `seo-render-verify` skill. For prerendered/SSG
   sites the served HTML is the indexed truth — a value that only appears in the
   DOM did not really ship.

3. **ALWAYS base SEO changes on real GSC data, not assumptions.**  
   Pull actual Search Console data using the `gsc-seo-audit` skill before making recommendations.

4. **NEVER add structured data that doesn't match visible page content.**  
   Google's guidelines explicitly prohibit this and it can result in manual actions.

5. **NEVER remove `noindex` from pages with genuinely thin/low-quality content** without first improving the content.

6. **ALWAYS run `npm run build` (or equivalent) after changes and before committing.**  
   Broken builds ship broken SEO.

7. **ALWAYS read configuration first:** project-local `.seo-config.json` (repo
   root) → else global `~/.config/seo-autopilot/config.json` → else ask the user
   for `site_url` and `repo_path`. Get the site URL, repo path, and GSC
   credentials path before starting any workflow.

7a. **DEFAULT to opening a Pull Request, never auto-merge to `main`** unless
    `auto_merge: true` is explicitly set in config. A human should review
    AI-written SEO changes before production.

## Data Interpretation Rules

8. **CTR below 2% for pages in position 1–10 is a critical signal** — focus on title and description optimization first.

9. **High impressions + zero clicks = structured data and title/description problem** — not a ranking problem.

10. **Traffic drops >50% in 28-day comparison** require investigation of: sitemap indexing status, canonical changes, robots.txt changes, and structured data errors in GSC.

11. **Locale traffic signals** — Identify which country/language has the highest impressions/CTR, and prioritize that locale's translations, title, and meta tags.

## Workflow Sequencing Rules

12. **Always follow this sequence:**  
    Step 1 (GSC Data) → Step 2 (Analysis) → Step 3 (Branch + Code) → Step 4 (DevTools Verify) → Step 5 (Merge + Deploy)

13. **Never skip Step 4 (Chrome DevTools verification)** even if the build succeeds. SSG/prerendering can mask runtime meta tag issues.

14. **After deployment, wait at least 48 hours before re-pulling GSC data** to compare. GSC data has a 2–3 day delay.
