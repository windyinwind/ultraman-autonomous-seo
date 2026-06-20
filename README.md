# SEO Autopilot 🛫

<p align="center">
  <img src="images/logo.jpg" alt="SEO Autopilot" width="280px" style="border-radius: 12px;"/>
</p>

**Your site's self-driving SEO.** SEO Autopilot turns any AI coding agent into a
disciplined, data-driven SEO engineer: it pulls **real Google Search Console
data**, finds the highest-ROI opportunities, implements **Google-recommended
fixes in a safe branch**, **verifies the rendered output** (raw HTML *and* live
DOM), and ships — on loop.

No guessing. No keyword-stuffing. Just measured changes based on what your site
actually ranks for.

---

## What it does — the loop

1. **Pull** — real impressions, clicks, CTR, positions, indexing status from GSC.
2. **Analyze** — classify queries (critical / high / growth) per Google's guidelines.
3. **Implement** — titles, descriptions, JSON-LD, canonicals, hreflang, sitemap — on a branch.
4. **Verify** — confirm tags in the **served HTML** *and* the **rendered DOM**, and diff them.
5. **Ship** — open a PR (default) or auto-merge, then track CTR vs. baseline in 7–14 days.

## Why it's different

- **Data-driven, not vibes** — every change traces back to a GSC signal.
- **Safe by default** — works on a branch, opens a **Pull Request** (never silently
  pushes to `main` unless you opt in), build must pass.
- **Catches the bug everyone misses** — for prerendered/SSR/SPA sites, the title
  you edited in a component is not always the title Google indexes. SEO Autopilot
  diffs the **raw HTML** against the **rendered DOM** so a change that "didn't
  show up" gets caught before it ships. (See [render verification](#-the-render-verification-edge).)

---

## Works with *any* agent

The workflow ships in two interoperable formats so it runs everywhere:

| Format | Used by | How it loads |
|--------|---------|--------------|
| **`AGENTS.md`** (universal standard) | Codex, Cursor, Windsurf, Aider, Zed, Gemini, Jules, … | Drop `AGENTS.md` in your repo root — these agents read it automatically |
| **Agent Skills** (`SKILL.md`) | Claude Code, Gemini CLI | Installed to the agent's skills dir by the installer |
| **Claude plugin** (`.claude-plugin/plugin.json`) | Claude Code | Loadable as a plugin/marketplace |

The single self-contained `AGENTS.md` carries the entire workflow, so even an
agent with no plugin system at all can run it.

---

## 🚀 Install

```bash
git clone https://github.com/windyinwind/seo-autopilot.git
cd seo-autopilot
./install.sh        # macOS / Linux
# or:  node install.js   # Windows / macOS / Linux
```

The installer:
- copies a canonical copy to `~/.config/seo-autopilot/`,
- installs the skills into **Claude Code** (`~/.claude/skills/`) and **Gemini**
  (`~/.gemini/skills/`) if present (restart the agent to load them),
- prints the one step for every other agent: **copy `AGENTS.md` into your
  website repo root**.

> Custom location: `TARGET_DIR=/custom/path ./install.sh`

---

## 🔌 Connect Google Search Console (required)

This is the data source — the one prerequisite. It's a ~10-minute, one-time
OAuth setup with copy-paste commands for Claude Code, Codex, Gemini, Cursor, and
Windsurf:

👉 **[docs/gsc-mcp-setup.md](docs/gsc-mcp-setup.md)**

If the GSC MCP isn't connected, the agent will tell you and offer to either help
set it up or accept metrics you paste manually.

## 🔍 Connect Chrome DevTools (recommended)

For Step 4 render verification we recommend the **Chrome DevTools MCP** (lighter
than Playwright, easy to set up):

```bash
claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest
```

(or the equivalent `mcpServers` entry for your agent). The raw-HTML half of
verification works with just `curl`, so this is optional but recommended.

---

## ⚙️ Configure

Create `.seo-config.json` in your **website** repo root (preferred), or edit the
global `~/.config/seo-autopilot/config.json`:

```json
{
  "site_url": "https://your-domain.com/",
  "repo_path": "/Users/you/Code/your-website",
  "build_command": "npm run build",
  "dev_command": "npm run dev",
  "dev_url": "http://localhost:5173",
  "supported_languages": ["en", "ja"],
  "auto_merge": false,
  "key_pages": [
    { "path": "/",    "schema_types": ["SoftwareApplication", "WebSite", "Organization"] },
    { "path": "/faq", "schema_types": ["FAQPage"] }
  ]
}
```

`auto_merge` is `false` by default → the agent opens a PR instead of merging.

---

## 🛠 Usage

Just ask your agent:

- *"Audit my website's SEO using Search Console data and optimize it."*
- *"Create an SEO branch and fix our structured data."*
- *"Did my latest title/keyword changes actually ship? Verify the rendered output."*

---

## 🔬 The render-verification edge

Single-page apps and prerendered/SSG sites have **three** versions of a tag that
can disagree: what you edited, what the server returns, and what JS renders.
Google indexes the served HTML (and, on a delay, the rendered DOM) — **not** your
source component.

SEO Autopilot checks **both layers and diffs them**:

```
Layer A  curl <url>        → raw HTML the crawler sees   (prerender/SSG truth)
Layer B  Chrome DevTools   → rendered DOM after JS runs
         ───────────────────────────────────────────────
         diff → mismatch = your edit didn't really ship → fix the prerender/build
```

This is exactly the failure mode where "I changed the title/keywords but they
don't show up" happens. See
[skills/seo-render-verify/SKILL.md](skills/seo-render-verify/SKILL.md).

---

## 🤖 Automation (optional)

Run the loop on a schedule. **Two honest caveats** for unattended runs: the
agent CLI needs the **GSC MCP reachable in that environment** (service-account
auth is best for CI — see the setup doc), and you should keep `auto_merge:false`
so it opens PRs for review.

### GitHub Actions (weekly PR)

```yaml
name: SEO Autopilot
on:
  schedule: [{ cron: '0 0 * * 0' }]   # Sundays 00:00 UTC
  workflow_dispatch:
jobs:
  seo:
    runs-on: ubuntu-latest
    permissions: { contents: write, pull-requests: write }
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      # GSC service-account auth (no browser in CI). See docs/gsc-mcp-setup.md.
      - name: GSC credentials
        run: |
          echo '${{ secrets.GSC_SERVICE_ACCOUNT_JSON }}' > "$RUNNER_TEMP/gsc.json"
          echo "GOOGLE_APPLICATION_CREDENTIALS=$RUNNER_TEMP/gsc.json" >> "$GITHUB_ENV"
      - name: Run the agent (configure the GSC MCP for it first)
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}   # or your agent's key
        run: |
          # Invoke your agent CLI headlessly with the search-console MCP attached,
          # instruction: "Audit SEO using GSC, implement fixes in a branch, verify, open a PR."
          echo "See docs/gsc-mcp-setup.md to attach the MCP in headless/CI mode."
```

### Local cron (open a PR weekly)

```bash
#!/usr/bin/env bash
cd /Users/you/Code/your-website || exit 1
# headless agent call, e.g. Claude Code:
claude --dangerously-skip-permissions -p \
  "Audit SEO using the search-console MCP, implement fixes on a branch, verify rendered output, open a PR." \
  >> ./seo-autopilot.log 2>&1
```

```cron
0 2 * * 0 /Users/you/Code/your-website/scripts/seo-autopilot.sh
```

> Plain `cron` skips jobs while the machine is asleep. Use a wider window
> (e.g. `0 9-21 * * 0`) plus a self-disabling guard, or `launchd`, if that matters.

---

## 📄 License

MIT — see [LICENSE](LICENSE). Free to use, modify, and distribute.
