# OpenClaw on Hostinger for AfroTools

This repo is already tuned for Codex-first workflows. If you want to add OpenClaw on Hostinger, treat it as an operations sidecar for repo work, not as a replacement for the public AfroTools site.

AfroTools should stay where it already belongs:

- Public site: Netlify
- Repo automation and agent runtime: Hostinger
- Live data operations: Supabase MCP first

## Pick the right Hostinger path

### 1-Click OpenClaw

Use this when you want a fast managed assistant with minimal server work.

Good fit:

- personal productivity
- WhatsApp or Telegram assistant flows
- quick experiments

Weak fit for AfroTools repo operations:

- less control over the underlying machine
- oriented around messaging onboarding
- not the best starting point if you want deep git, Node, Playwright, or MCP-heavy workflows

### Hostinger VPS + manual OpenClaw install

This is the recommended path for AfroTools.

Why:

- you control SSH, git, Node, Docker, and local secrets
- you can clone the repo directly onto the server
- you can wire in ChatGPT Pro Codex auth
- you can keep the agent close to the validation commands this repo already uses

## Recommended AfroTools architecture

1. Keep the public site on Netlify.
2. Run OpenClaw on a Hostinger VPS under a private subdomain or VPN-only endpoint.
3. Clone `afrotools` onto that VPS.
4. Authenticate OpenClaw with `openai-codex` so it can use your ChatGPT Pro Codex access.
5. Use the prompt in [prompts/openclaw-afrotools-system-prompt.md](/Users/Oza/Documents/afrotools/prompts/openclaw-afrotools-system-prompt.md).
6. Keep deployment secrets local to the VPS and out of git.

## Current config format

As of April 15, 2026, the current OpenClaw docs use:

- config path: `~/.openclaw/openclaw.json`
- current schema: JSON or JSON5-style config

Use the ready-to-edit template in [ops/openclaw/openclaw.hostinger.example.jsonc](/Users/Oza/Documents/afrotools/ops/openclaw/openclaw.hostinger.example.jsonc).

## Deployment bundles in this repo

You now have both deployment styles in-repo:

- Docker Compose: [ops/openclaw/docker-compose.hostinger.yml](/Users/Oza/Documents/afrotools/ops/openclaw/docker-compose.hostinger.yml)
- Compose env file: [ops/openclaw/openclaw.hostinger.env.example](/Users/Oza/Documents/afrotools/ops/openclaw/openclaw.hostinger.env.example)
- Systemd service: [ops/openclaw/systemd/openclaw-gateway.service](/Users/Oza/Documents/afrotools/ops/openclaw/systemd/openclaw-gateway.service)
- Systemd env file: [ops/openclaw/systemd/openclaw-gateway.env.example](/Users/Oza/Documents/afrotools/ops/openclaw/systemd/openclaw-gateway.env.example)

Use Docker Compose when:

- you want to stay close to Hostinger Docker Manager
- you want isolated upgrades and rollback
- you may front the gateway with Traefik

Use systemd when:

- you want the simplest always-on VPS install
- you are running OpenClaw directly on the host with `npm i -g openclaw@latest`
- you prefer SSH tunnel or Tailscale access over reverse proxying

## Quick setup

### 1. Provision the VPS

Use Ubuntu 22.04 LTS or newer.

Install the basics:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl unzip ca-certificates
```

Install Node.js and npm with the version you want to use for repo commands.

### 2. Install OpenClaw

Follow the official OpenClaw install docs on the VPS.

If you only want the managed Hostinger flow, use Hostinger's 1-click setup in hPanel instead.

### 3. Authenticate with ChatGPT Pro Codex

OpenClaw supports the `openai-codex` provider for ChatGPT OAuth flows.

Use one of:

```bash
openclaw onboard --auth-choice openai-codex
```

or:

```bash
openclaw models auth login --provider openai-codex
```

Then set the primary model to:

```text
openai-codex/gpt-5.4
```

Use the current OpenClaw config format, not the old simplified YAML examples, for a fresh Hostinger VPS setup.

### 4. Clone AfroTools

```bash
git clone https://github.com/Ozaveshe/afrotools.git
cd afrotools
npm install
```

### 5. Add repo secrets locally

Use the repo's existing [.env.example](/Users/Oza/Documents/afrotools/.env.example) as your reference.

Do not commit:

- OpenClaw auth files
- repo `.env`
- provider tokens
- Supabase service keys
- Netlify tokens

### 6. Load the AfroTools operating prompt

Use [prompts/openclaw-afrotools-system-prompt.md](/Users/Oza/Documents/afrotools/prompts/openclaw-afrotools-system-prompt.md) as your OpenClaw system prompt or base instruction set.

## Hostinger fix path

If your current Hostinger setup is not behaving, use this order.

### Case A: You deployed 1-Click OpenClaw and want ChatGPT Pro Codex

Move to a Hostinger VPS workflow.

Why:

- Hostinger's 1-click model switch docs currently support only `nexos.ai`, `OpenAI`, `Anthropic`, and `xAI` provider paths through hPanel API-key configuration
- ChatGPT Pro Codex uses the `openai-codex` OAuth path in OpenClaw
- that makes VPS plus manual OpenClaw control the safer AfroTools setup

### Case B: You deployed OpenClaw on a Hostinger VPS but the UI is broken

Do these in order:

1. Deploy Traefik in Hostinger Docker Manager.
2. Re-open OpenClaw through the HTTPS `Open` link in Docker projects.
3. Log in with the saved `OPENCLAW_GATEWAY_TOKEN`.
4. If you still cannot reach the dashboard, verify the OpenClaw project is running and note the exposed port.
5. If you are using your own config, make sure the gateway bind is `lan` rather than `loopback` when running in Docker bridge mode.

### Case C: The model is wrong or OpenClaw is still asking for API keys

SSH into the VPS and run:

```bash
openclaw models auth login --provider openai-codex
openclaw models status
```

Then update the config to use:

```text
openai-codex/gpt-5.4
```

### Case D: Config edits broke the instance

Run:

```bash
openclaw config validate
openclaw doctor --yes
```

Then compare your config against [ops/openclaw/openclaw.hostinger.example.jsonc](/Users/Oza/Documents/afrotools/ops/openclaw/openclaw.hostinger.example.jsonc).

## Hostinger step-by-step recovery

Use this if you want the shortest path to a working AfroTools agent on Hostinger VPS.

1. In hPanel, confirm you are using `VPS`, not just `1-Click OpenClaw`.
2. In `VPS -> Docker Manager`, deploy OpenClaw if it is not already installed.
3. Save the generated `OPENCLAW_GATEWAY_TOKEN`.
4. In the same Docker Manager, deploy `Traefik`.
5. Wait until both projects show `Running`.
6. Open the HTTPS OpenClaw link from the Access column.
7. Log in with the gateway token.
8. SSH into the VPS.
9. Install Node 24 if it is missing.
10. Run `npm i -g openclaw@latest` if you want direct CLI access on the host.
11. Run `openclaw models auth login --provider openai-codex`.
12. Copy the example config from [ops/openclaw/openclaw.hostinger.example.jsonc](/Users/Oza/Documents/afrotools/ops/openclaw/openclaw.hostinger.example.jsonc) into `~/.openclaw/openclaw.json`.
13. Adjust the workspace and repo path to where AfroTools is cloned on the VPS.
14. Run `openclaw config validate`.
15. Run `openclaw models status`.
16. Clone the repo and run `npm install` in the AfroTools workspace.
17. Start with read-heavy validation tasks before enabling broader edits.

## Docker Compose path

This is the best match if you are using Hostinger VPS plus Docker Manager.

### Files

- config template: [ops/openclaw/openclaw.hostinger.example.jsonc](/Users/Oza/Documents/afrotools/ops/openclaw/openclaw.hostinger.example.jsonc)
- compose file: [ops/openclaw/docker-compose.hostinger.yml](/Users/Oza/Documents/afrotools/ops/openclaw/docker-compose.hostinger.yml)
- env file: [ops/openclaw/openclaw.hostinger.env.example](/Users/Oza/Documents/afrotools/ops/openclaw/openclaw.hostinger.env.example)

### Commands

```bash
sudo mkdir -p /opt/openclaw/config /opt/afrotools
cd /opt
git clone https://github.com/Ozaveshe/afrotools.git /opt/afrotools
cp /opt/afrotools/ops/openclaw/openclaw.hostinger.env.example /opt/openclaw/.env
cp /opt/afrotools/ops/openclaw/openclaw.hostinger.example.jsonc /opt/openclaw/config/openclaw.json
sudo chown -R 1000:1000 /opt/openclaw/config /opt/afrotools
docker compose --env-file /opt/openclaw/.env -f /opt/afrotools/ops/openclaw/docker-compose.hostinger.yml up -d
```

### First checks

```bash
docker compose --env-file /opt/openclaw/.env -f /opt/afrotools/ops/openclaw/docker-compose.hostinger.yml ps
docker compose --env-file /opt/openclaw/.env -f /opt/afrotools/ops/openclaw/docker-compose.hostinger.yml logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

### Codex login from the container

```bash
docker compose --env-file /opt/openclaw/.env -f /opt/afrotools/ops/openclaw/docker-compose.hostinger.yml run --rm openclaw-cli models auth login --provider openai-codex
docker compose --env-file /opt/openclaw/.env -f /opt/afrotools/ops/openclaw/docker-compose.hostinger.yml run --rm openclaw-cli models status
```

If the OAuth flow opens a URL in headless mode, copy the full redirect URL you land on and paste it back into the wizard.

### Safe access methods

Recommended:

- SSH tunnel: `ssh -N -L 18789:127.0.0.1:18789 user@your-vps`
- Tailscale
- HTTPS reverse proxy in front of the localhost-published port

If you intentionally expose the container port publicly, secure it first.

## Systemd path

This is the best match if you want the cleanest always-on host install.

### Files

- config template: [ops/openclaw/openclaw.hostinger.example.jsonc](/Users/Oza/Documents/afrotools/ops/openclaw/openclaw.hostinger.example.jsonc)
- unit file: [ops/openclaw/systemd/openclaw-gateway.service](/Users/Oza/Documents/afrotools/ops/openclaw/systemd/openclaw-gateway.service)
- env file: [ops/openclaw/systemd/openclaw-gateway.env.example](/Users/Oza/Documents/afrotools/ops/openclaw/systemd/openclaw-gateway.env.example)

### Commands

```bash
sudo useradd --system --create-home --shell /bin/bash openclaw
sudo mkdir -p /etc/openclaw /opt/afrotools
sudo cp /opt/afrotools/ops/openclaw/systemd/openclaw-gateway.env.example /etc/openclaw/openclaw.env
sudo cp /opt/afrotools/ops/openclaw/systemd/openclaw-gateway.service /etc/systemd/system/openclaw-gateway.service
sudo mkdir -p /home/openclaw/.openclaw
sudo cp /opt/afrotools/ops/openclaw/openclaw.hostinger.example.jsonc /home/openclaw/.openclaw/openclaw.json
sudo chown -R openclaw:openclaw /home/openclaw/.openclaw /opt/afrotools
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway
```

### First checks

```bash
sudo systemctl status openclaw-gateway --no-pager
sudo journalctl -u openclaw-gateway -f
curl -fsS http://127.0.0.1:18789/healthz
```

### Codex login on the host

```bash
sudo -u openclaw -H openclaw models auth login --provider openai-codex
sudo -u openclaw -H openclaw models status
```

### Security note for systemd mode

For a host-native install, change `gateway.bind` in the config to `loopback` unless you have a specific reason to publish the gateway more broadly.

## Fast troubleshooting

### `Control UI requires device identity (use HTTPS or localhost secure context)`

Fix:

- deploy Traefik
- reopen the HTTPS Access link from Hostinger
- stop using plain `http://IP:port` for normal control UI access

### Dashboard opens but login fails

Fix:

- use the saved `OPENCLAW_GATEWAY_TOKEN`
- if lost, recover it from Hostinger Docker project environment settings

### UI loads but model usage is not Codex

Fix:

- run `openclaw models auth login --provider openai-codex`
- run `openclaw models status`
- set primary model to `openai-codex/gpt-5.4`

### Container is reachable by port but agent does not respond

Fix:

- validate config with `openclaw config validate`
- run `openclaw doctor --yes`
- if Docker bridge networking is used, set gateway bind to `lan`

### You want to keep 1-click but use ChatGPT Pro Codex

Current safest answer:

- do not rely on 1-click for that path
- use a Hostinger VPS where you control the OpenClaw OAuth login and config directly

## Safe first tasks for AfroTools

Start with read-only or validation-heavy jobs:

- `npm run check-links`
- `npm run audit`
- `npm run seo:report`
- `npm test`
- targeted reviews of `assets/js/components/tool-registry.js`
- content or registry patch planning

Then move to controlled edits:

- tool additions following `docs/ADDING-A-TOOL.md`
- country surface work following `docs/ADDING-A-COUNTRY.md`
- SEO sweeps using existing scripts
- release QA using the repo checklist

## Avoid these early mistakes

- Do not move the public AfroTools site from Netlify to Hostinger just because the agent runs there.
- Do not give the first OpenClaw setup production deploy credentials before you trust the workflow.
- Do not hand-edit generated files first.
- Do not bypass the repo's existing SEO, i18n, and registry scripts.
- Do not use live Supabase actions from the repo shell when MCP access is available.

## Good OpenClaw jobs for AfroTools

- nightly SEO report and issue grouping
- registry integrity checks before release
- draft changelog generation from repo diffs
- batch content QA over country pages
- first-pass review of tool metadata and internal links

## Good jobs to keep outside the first rollout

- automatic production deploys
- autonomous writes to `_redirects`, `_headers`, or minified bundles
- unsupervised schema or auth changes in Supabase
- large-scale content rewrites without validation gates

## Sources

- Hostinger 1-Click OpenClaw overview: https://www.hostinger.com/support/what-is-1-click-openclaw-and-how-to-set-it-up/
- Hostinger 1-Click OpenClaw model switching: https://www.hostinger.com/support/how-to-change-the-ai-model-for-1-click-openclaw/
- OpenClaw configuration docs: https://openclawdoc.com/docs/getting-started/configuration/
- OpenClaw model providers: https://docs.openclaw.ai/concepts/model-providers
- OpenClaw OpenAI provider docs: https://docs.openclaw.ai/providers/openai
- OpenClaw configuration examples: https://docs.openclaw.ai/gateway/configuration-examples
- OpenClaw configuration reference: https://docs.openclaw.ai/gateway/configuration-reference
- OpenClaw doctor: https://docs.openclaw.ai/gateway/doctor
- Hostinger VPS OpenClaw install: https://www.hostinger.com/support/how-to-install-openclaw-on-hostinger-vps/
- Hostinger OpenClaw SSL with Traefik: https://www.hostinger.com/support/how-to-add-ssl-to-openclaw-on-hostinger/
- Hostinger OpenClaw hardening: https://www.hostinger.com/support/how-to-secure-and-harden-openclaw-security/
- OpenAI Codex in ChatGPT: https://help.openai.com/en/articles/11369540-codex-in-chatgpt
- OpenAI billing split between ChatGPT and Platform: https://help.openai.com/en/articles/9039756-billing-settings-in-chatgpt-vs-platform
