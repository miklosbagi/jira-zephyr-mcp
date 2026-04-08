# Docker Hub documentation (maintainers)

Copy the sections below into the [Docker Hub](https://hub.docker.com/r/miklosbagi/jira-zephyr-mcp) **Full description** when you refresh the page. Keep it aligned with [`README.md`](../README.md) **Quick start** and [`MCP-CURSOR-DOCKER.md`](MCP-CURSOR-DOCKER.md).

**CI note:** [`.github/workflows/docker-pr.yml`](../.github/workflows/docker-pr.yml) publishes PR preview tags `dev-v*-<sha>` plus **`dev`** on Docker Hub and GHCR (`ghcr.io/...`). **`dev`** always points at the last successful PR build from that workflow.

---

## MCP quick start (Cursor & other hosts)

Cursor and some MCP hosts **do not use the same `PATH` as your terminal**. Set **`command`** to the **absolute path** of the Docker CLI (e.g. macOS Docker Desktop: `/usr/local/bin/docker`; Linux: often `/usr/bin/docker`) and add **`PATH`** to **`env`** next to your Jira/Zephyr variables. After editing `~/.cursor/mcp.json` or `.cursor/mcp.json`, **restart Cursor** or reload MCP. **Docker Desktop** must be running.

**Do not** put the entire `docker run …` string in **`command`** with an empty **`args`** array—use **`command`** = `docker` binary, **`args`** = `["run", …]`.

EU Zephyr example (replace secrets):

```json
{
  "mcpServers": {
    "jira-zephyr": {
      "command": "/usr/local/bin/docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "JIRA_BASE_URL",
        "-e", "JIRA_USERNAME",
        "-e", "JIRA_API_TOKEN",
        "-e", "ZEPHYR_API_TOKEN",
        "-e", "ZEPHYR_BASE_URL",
        "miklosbagi/jira-zephyr-mcp:latest"
      ],
      "env": {
        "PATH": "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin",
        "JIRA_BASE_URL": "https://your-domain.atlassian.net",
        "JIRA_USERNAME": "your-email@company.com",
        "JIRA_API_TOKEN": "your-jira-api-token",
        "ZEPHYR_API_TOKEN": "your-zephyr-api-token",
        "ZEPHYR_BASE_URL": "https://eu.api.zephyrscale.smartbear.com/v2"
      }
    }
  }
}
```

- **US:** remove `ZEPHYR_BASE_URL` from `args` and `env`.
- **Pinned tag:** use `miklosbagi/jira-zephyr-mcp:v0.12.0` (or another tag) instead of `:latest` in `args`.
- **GHCR:** `ghcr.io/miklosbagi/jira-zephyr-mcp:latest` (same `command` / `args` shape).

Full repo: [github.com/miklosbagi/jira-zephyr-mcp](https://github.com/miklosbagi/jira-zephyr-mcp).
