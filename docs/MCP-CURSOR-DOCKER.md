# MCP + Cursor + Docker (recommended setup)

Cursor (and some other MCP hosts) **do not always inherit the same `PATH` as your terminal**. If `command` is just `"docker"`, the server may fail to start with “executable not found” or connect only after you change something unrelated. **Pin the Docker CLI to an absolute path** and **set `PATH` in `env`** so child processes (including `docker buildx`) resolve like a normal shell.

**Docker Desktop** must be running before MCP servers that use Docker will connect.

After editing `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project), **restart Cursor** or reload MCP so the config is picked up.

---

## Jira Zephyr MCP (`:latest` or `:v0.12.0`)

Use **`command`** = absolute path to the `docker` binary (common on macOS with Docker Desktop: `/usr/local/bin/docker`). Use a normal **`args`** array for `run`, `--rm`, `-i`, `-e` … and the image tag.

Set **`PATH`** in **`env`** alongside your Jira/Zephyr variables so resolution matches a typical login shell. Adjust if your machine installs Docker elsewhere (e.g. Linux: `/usr/bin/docker`; Apple Silicon Homebrew: often `/opt/homebrew/bin/docker`).

**Example (EU Zephyr):** replace credential placeholders.

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

- **US Zephyr:** remove `ZEPHYR_BASE_URL` from both `args` (`-e` …) and `env`.
- **Pin a release:** swap `miklosbagi/jira-zephyr-mcp:latest` for e.g. `miklosbagi/jira-zephyr-mcp:v0.12.0` in `args` only.
- **GHCR:** use `ghcr.io/miklosbagi/jira-zephyr-mcp:latest` (or another tag) in place of the Hub image name in `args`.

---

## Jira Zephyr MCP — local dev (build / iterate)

If your MCP entry uses **`sh -c`** (or similar) to run **`docker`**, **`docker build`**, or **`docker buildx`**, add the same kind of **`PATH`** to **`env`**. Otherwise the script may not find `docker` or `buildx` even when your interactive shell does.

Use the same absolute `docker` path in the script if possible.

---

## GitHub MCP (Docker-based)

**Incorrect:** putting the **entire** `docker run …` string in **`command`** and leaving **`args`** as **`[]`**. Many hosts expect **`command`** = one executable and **`args`** = argv tokens.

**Correct:** same pattern as above:

- `"command": "/usr/local/bin/docker"` (or your absolute `docker` path)
- `"args": ["run", …]` with image and flags split as separate array elements
- `"env": { "PATH": "…" }` as needed so `docker` and helpers resolve reliably

---

## Docker Hub long description (maintainers)

When updating [Docker Hub](https://hub.docker.com/r/miklosbagi/jira-zephyr-mcp), paste or adapt the ready-made fragment in **[DOCKER-HUB-MCP.md](DOCKER-HUB-MCP.md)** so the Hub page stays in sync with [`README.md`](../README.md) **Quick start** and this doc. Keep the **absolute `docker` path** and **`PATH`** note so users pasting into `mcp.json` succeed on Cursor after recent editor updates.
