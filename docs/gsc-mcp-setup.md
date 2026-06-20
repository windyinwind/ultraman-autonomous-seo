# Connecting Google Search Console (GSC MCP)

SEO Autopilot pulls **real** search data (queries, impressions, clicks, CTR,
positions, indexing status) through the **`search-console` MCP server**. This
is the one prerequisite that unlocks the whole workflow. It takes ~10 minutes
once.

There is **no official Google-hosted GSC MCP**. We use the community server
[`mcp-server-google-search-console`](https://www.npmjs.com/package/mcp-server-google-search-console),
which talks to the Search Console API using **OAuth** (recommended) or a
service account.

---

## What you need

- A Google account that has access to your site in
  [Search Console](https://search.google.com/search-console) (Owner or Full user).
- Node.js 18+ (`npx` is used to run the server — nothing to install globally).

---

## Step 1 — Create an OAuth client in Google Cloud

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and create
   (or pick) a project.
2. **APIs & Services → Library →** search **"Google Search Console API"** → **Enable**.
3. **APIs & Services → OAuth consent screen:** configure it (External is fine),
   add your Google account under **Test users**.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID →
   Application type: Desktop app** → Create.
5. **Download JSON.** Save it to a stable path:

   ```bash
   mkdir -p ~/.gsc
   mv ~/Downloads/client_secret_*.json ~/.gsc/client_secrets.json
   ```

> This file's top-level key should be `"installed"` (a Desktop OAuth client).

---

## Step 2 — Register the MCP server in your agent

Pick your agent. In every case the server command is the same:

```
npx -y mcp-server-google-search-console
```

with the environment variable `GSC_OAUTH_CLIENT_FILE` pointing at the JSON from
Step 1.

### Claude Code

```bash
claude mcp add search-console -s user \
  -e GSC_OAUTH_CLIENT_FILE=$HOME/.gsc/client_secrets.json \
  -- npx -y mcp-server-google-search-console
```

### Codex CLI — `~/.codex/config.toml`

```toml
[mcp_servers.search-console]
command = "npx"
args = ["-y", "mcp-server-google-search-console"]
env = { GSC_OAUTH_CLIENT_FILE = "/Users/you/.gsc/client_secrets.json" }
```

### Gemini CLI — `~/.gemini/settings.json`

```json
{
  "mcpServers": {
    "search-console": {
      "command": "npx",
      "args": ["-y", "mcp-server-google-search-console"],
      "env": { "GSC_OAUTH_CLIENT_FILE": "/Users/you/.gsc/client_secrets.json" }
    }
  }
}
```

### Cursor — `~/.cursor/mcp.json` (or `.cursor/mcp.json` in the project)

### Windsurf — `~/.codeium/windsurf/mcp_config.json`

Both use the same JSON shape as the Gemini example above (a `mcpServers` map).

---

## Step 3 — First-run authorization (one time)

The first time the server is called it runs the OAuth flow: a browser opens, you
pick your Google account and approve read-only Search Console access. The token
is cached (typically at `~/.config/gsc-mcp/oauth-token.json`) and refreshed
automatically afterwards — no browser needed again.

> **Headless / CI / cron:** there is no browser. Authorize once interactively on
> a desktop first, then copy the cached token file to the headless machine, or
> use the service-account method below.

---

## Step 4 — Verify

Ask your agent: **"List my Search Console sites."** It should call
`list_sites` and return your verified properties. If you see
`https://your-domain.com/` with `permission: owner` (or `siteFullUser`), you're done.

Tools this server exposes: `list_sites`, `get_search_analytics`,
`get_performance_summary`, `list_sitemaps`, `inspect_url`, `batch_inspect_urls`,
`get_site`.

---

## Alternative — Service-account auth (good for CI / teams)

Instead of OAuth you can use a Google Cloud **service account**:

1. **Credentials → Create Credentials → Service account.** Create a JSON key and
   download it.
2. In **Search Console → Settings → Users and permissions → Add user**, paste
   the service account's `client_email` and grant **Full**.
3. Point the server at the key file instead of the OAuth client:
   set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json` in the
   MCP server's `env` (and set `gcp_credentials_path` in your `.seo-config.json`).

Service accounts need no browser, so they are the better fit for unattended
GitHub Actions / cron loops.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `403` / "unverified permission" on API calls | The account/service-account isn't added to that GSC property, or you picked the wrong property. Re-check Search Console → Users and permissions. |
| Browser never opens / hangs in CI | Headless env. Authorize once on a desktop and copy the cached token, or switch to service-account auth. |
| `invalid_client` | `GSC_OAUTH_CLIENT_FILE` path is wrong, or the JSON isn't a **Desktop** OAuth client (top key must be `installed`). |
| Server "connected" but no tools | Restart the agent session after adding the MCP — most agents load MCP tools only at session start. |
| `get_search_analytics` returns one aggregated row | You must pass `dimensions` (e.g. `["query"]` or `["page"]`) to get a breakdown. |

---

## References
- npm: <https://www.npmjs.com/package/mcp-server-google-search-console>
- Search Console API: <https://developers.google.com/webmaster-tools>
- Model Context Protocol: <https://modelcontextprotocol.io>
