# SEO Optimizer Plugin — Agent Rules

## Core Rules (Always Apply)

1. **ALWAYS create a git branch before making any SEO code changes.**  
   Never commit SEO changes directly to `main`. Use the `seo-branch-workflow` skill.

2. **ALWAYS verify rendered DOM after changes using Chrome DevTools.**  
   For React/SPA sites, HTML source ≠ rendered output. Meta tags injected via JS must be confirmed in the live DOM using the `seo-render-verify` skill.

3. **ALWAYS base SEO changes on real GSC data, not assumptions.**  
   Pull actual Search Console data using the `gsc-seo-audit` skill before making recommendations.

4. **NEVER add structured data that doesn't match visible page content.**  
   Google's guidelines explicitly prohibit this and it can result in manual actions.

5. **NEVER remove `noindex` from pages with genuinely thin/low-quality content** without first improving the content.

6. **ALWAYS run `npm run build` (or equivalent) after changes and before committing.**  
   Broken builds ship broken SEO.

7. **ALWAYS read configuration from the project-local `.antigravity/seo-config.json` or fallback plugin `config.json`** to get the site URL, repo path, and credentials path before starting any workflow.

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
