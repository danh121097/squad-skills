# Decision server

`src/decide/` is a local stdio MCP server with one tool, `decide`. An agent
passes a state and a set of typed questions, and a decision model returns one
answer per question with probabilities: which skill to route to, how risky a
change is, whether a finding looks like a false positive.

It is a dogfooding tool for this checkout. It is not in `dist/`, the npm
package or either plugin manifest, and no skill calls it yet. Whether a skill
should is decided by an eval comparison, not by this server existing.

## Providers

The tool never names a provider. `src/decide/semantic-decision.ts` holds the
registry, and each provider declares its models and the credentials it needs.

| Provider | Models               | Credentials                                     |
| -------- | -------------------- | ----------------------------------------------- |
| `clef`   | `clef`, `clef-flash` | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` |

Clef runs on Cloudflare Workers AI. Create the token from the **Workers AI**
template at <https://dash.cloudflare.com/profile/api-tokens>.

## Two locks

Having a credential is not consent, and the user's consent is not a project's
permission.

- **Off by default.** Only the user scope enables it, picks the provider and
  picks the model, in `~/.squad-skills/decide.json`:

  ```json
  { "enabled": true, "provider": "clef", "model": "clef-flash" }
  ```

- **Credentials come from the user only.** The process environment is read
  first, then `~/.squad-skills/.env` as plain `KEY=VALUE` lines. A project's
  `.squad-skills/.env` is never opened.
- **A project can only narrow.** A `.squad-skills/decide.json` in the
  server's working directory or any parent may set `"enabled": false`, or
  allowlists `"providers"` and `"models"`. Every such file applies, so starting
  in a subdirectory does not step around one. An allowlist that excludes the
  user's choice turns the tool off rather than picking another model.
  `enabled: true`, `provider` and `model` in a project file are ignored, and
  any other key, or an `enabled` that is not a boolean, turns the tool off so a
  typo never drops a restriction.
- **Advice only.** The tool takes data, never a provider or model, and its
  answer authorizes nothing. It does not lower a gate tier or drop a finding.

Any unreadable settings file turns the tool off. When it is off, `decide`
returns `"status": "disabled"` with the reason and makes no network call.

## Run it

Register it for your user only, so no committed `.mcp.json` carries it:

```sh
claude mcp add --scope user squad-decide -- node /absolute/path/to/squad-skills/src/decide/mcp-server.ts
```

Codex: add the same command under `[mcp_servers.squad-decide]` in
`~/.codex/config.toml`.

The server speaks the MCP versions that open with an `initialize` handshake,
2025-11-25 and earlier. It does not implement 2026-07-28, which replaced that
handshake with `server/discover`.

The tests in `tests/decide/` cover the settings rules, the provider request and
the protocol handshake without any network call.
