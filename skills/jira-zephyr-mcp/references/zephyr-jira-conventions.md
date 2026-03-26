# Zephyr + Jira conventions (jira-zephyr-mcp)

Short reference; the MCP server implements these in `src/tools/` and `src/clients/`.

## Issue linking (coverage)

- Zephyr Scale Cloud: `POST /testcases|testcycles|testplans/{key}/links/issues` with body **`{ "issueId": <int64> }`** (Jira Cloud numeric id).
- Do **not** rely on undocumented legacy shapes that send only issue keys to Zephyr without resolution—those often return **405**.
- The fork resolves Jira keys via **`GET /rest/api/3/issue/{key}`** (fields include `id`), then posts to Zephyr.

## `ZEPHYR_BASE_URL`

- Optional; defaults to US Scale API base.
- **EU example:** `https://eu.api.zephyrscale.smartbear.com/v2`
- Wrong host → auth or routing failures.

## PUT / merge behavior

Many updates (test cases, cycles, plans, environments) are implemented as **read existing, merge fields, write full body**. Empty or partial UI-style patches may **400** if the API requires a full entity.

## MCP stdio

The server uses **stdio** for JSON-RPC; stdout must remain protocol-only (no stray `console.log` in production paths). Config loading uses `dotenv` with **quiet** mode for the same reason.
