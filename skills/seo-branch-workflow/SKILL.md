---
name: seo-branch-workflow
description: >
  Safe git branching and deployment workflow for SEO changes. Activate when
  implementing any SEO modifications — always create a branch before editing,
  run build verification, and merge only after Chrome DevTools confirmation.
  Trigger on: "create SEO branch", "safe SEO deploy", "SEO git workflow",
  "commit SEO changes". Works alongside gsc-seo-audit and seo-render-verify skills.
---

# SEO Git Branch Workflow

All SEO changes must go through this workflow to prevent accidental breaking changes in production.

---

## Why Branch for SEO Changes?

1. **Prerendering**: Many SEO sites use prerendering (SSG/SSR). A bad build can break all 1000+ pages
2. **Verification Gate**: The branch gives you a staging point to verify with Chrome DevTools before merging
3. **Rollback**: If a structured data schema causes a GSC error, you can revert instantly with `git revert`
4. **History**: SEO changes are tracked with clear commit messages, making it easy to correlate SERP changes with code changes

---

## Full Workflow

### Phase 1: Branch Creation

```bash
# From the repo root (use the configured repo_path)
cd <repo_path>

# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create SEO branch with date stamp
git checkout -b seo/gsc-audit-$(date +%Y-%m-%d)

echo "✅ Branch created: seo/gsc-audit-$(date +%Y-%m-%d)"
```

### Phase 2: Implement Changes

Follow the changes identified in `gsc-seo-audit` skill Step 2.

**File change checklist:**

| Change Type | Files to Edit |
|-------------|--------------|
| Page title/description | Page component (e.g., `Home.tsx`, `FAQ.tsx`) |
| Structured data (JSON-LD) | Page component via `<Seo structuredData={...}>` prop |
| Homepage fallback JSON-LD | `index.html` → `<script type="application/ld+json">` |
| Sitemap priorities | `scripts/generate_sitemap.mjs` |
| robots.txt | `public/robots.txt` |
| Hreflang | `Seo.tsx` component or sitemap generator |
| Locale translations | `src/i18n/locales/*.json` |
| Thin content noindex threshold | SEO component or page-level logic |

### Phase 3: Build Verification

```bash
# Regenerate any derived files first
node scripts/generate_sitemap.mjs    # if sitemap script exists

# Build (catches TypeScript errors, broken imports, etc.)
npm run build

# Check the build output is clean
echo "Exit code: $?"    # must be 0
```

**If build fails:** Fix errors before committing. Common SEO-related build failures:
- TypeScript type errors in `structuredData` prop (must be `Record<string, unknown>`)
- JSON syntax errors in `index.html` structured data block
- Missing i18n keys in locale files used by page components

### Phase 4: Chrome DevTools Verification

Start the dev server (or use the built dist):
```bash
npm run dev    # or: npm run preview (for built dist)
```

Then invoke the **`seo-render-verify` skill** to verify each changed page in
**both** layers:
- **Raw HTML** (`curl`) — what crawlers / prerender / SSG actually serve
- **Rendered DOM** (Chrome DevTools MCP preferred, Playwright fallback)
- **Diff them** — if the edited value is missing from the raw HTML or the two
  layers disagree, the change didn't really ship; fix the prerender/build source.

**Only proceed to Phase 5 if ALL checks pass.**

### Phase 5: Commit

```bash
# Stage all changes
git add -A

# Show what's being committed
git diff --cached --stat

# Commit with structured message
git commit -m "seo: <summary of changes>

Changes made based on GSC data ($(date +%Y-%m-%d)):
- <specific change 1>
- <specific change 2>
- <specific change 3>

GSC signals addressed:
- Query: '<keyword>' — pos X, Y impressions, Z% CTR
- Page: '<url>' — fixed <issue>"
```

### Phase 6: Ship — Pull Request (default) or Merge

**Default: open a Pull Request.** Do not merge to `main` yourself unless the user
set `auto_merge: true` in config. A human reviewing AI-written SEO changes before
they hit production is the safe default.

```bash
# Push the branch and open a PR
git push -u origin seo/gsc-audit-$(date +%Y-%m-%d)
gh pr create --fill   # or print the GitHub compare URL for the user
```

**Only if `auto_merge: true`** (trusted unattended loop):
```bash
git checkout main
git merge --no-ff seo/gsc-audit-$(date +%Y-%m-%d) -m "Merge seo/gsc-audit-$(date +%Y-%m-%d)"
git push origin main   # triggers CI/CD (Cloudflare Pages, Vercel, etc.)
echo "✅ Deployed. Monitor GSC in 48-72 hours."
```

### Phase 7: Post-Deployment GSC Actions

1. **Request Indexing** for all changed pages:
   - GSC → URL Inspection → paste URL → "Request Indexing"
   - Priority: homepage, then high-impression pages
   
2. **Validate Structured Data**:
   - Visit https://search.google.com/test/rich-results
   - Enter each changed URL
   - Confirm no errors or warnings

3. **Monitor** (check back after 7 days):
   ```
   get_performance_summary(site_url=<site_url>, period="7d")
   ```
   Compare with baseline captured in Step 1.

---

## Branch Naming Conventions

| Purpose | Branch Name Pattern |
|---------|-------------------|
| Scheduled GSC audit | `seo/gsc-audit-YYYY-MM-DD` |
| Specific page fix | `seo/fix-<page>-YYYY-MM-DD` |
| Structured data addition | `seo/add-schema-<type>-YYYY-MM-DD` |
| Sitemap fix | `seo/sitemap-fix-YYYY-MM-DD` |
| I18n SEO fix | `seo/i18n-<locale>-YYYY-MM-DD` |

---

## Rollback Procedure

If a deployed SEO change causes issues (GSC errors, ranking drop):

```bash
# Option 1: Revert the merge commit
git revert -m 1 <merge_commit_hash>
git push origin main

# Option 2: Revert specific file
git checkout main~1 -- src/pages/Home.tsx
git commit -m "seo: revert Home.tsx structured data change"
git push origin main
```

---

## References
- [Google: Control crawling and indexing](https://developers.google.com/search/docs/crawling-indexing/overview)
- [Git Best Practices for Large Projects](https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows)
