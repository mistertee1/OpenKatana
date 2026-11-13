# Free online trial plan

Status: preparation only. No infrastructure, external accounts, secrets, DNS, or paid services are created by this document.

## Important project constraint

OpenKatana is not a static web app. The hosted pilot described in `docs/HOSTING.md` requires a dedicated Linux x86-64 host, Docker Engine, gVisor, Python 3.11+, Caddy, persistent disk, a web process and a worker. It also requires operational security work. Netlify, Cloudflare Pages, and a static host cannot run that worker stack. Cloudflare Workers' free CPU/request limits are not a substitute for FFmpeg/Chromium/Blender rendering.

The project documentation's own hosting budget says the CPU-only hosted pilot is paid infrastructure, even without a GPU. Therefore do not claim that a complete, always-on hosted OpenKatana editor can run for $0/month.

## Recommended $0 validation phase

1. Keep the upstream-compatible OpenKatana engine and its local CLI workflow intact.
2. Build a separate responsive Arabic RTL web shell as a static frontend and deploy only that shell to Netlify Free (or Cloudflare Pages Free if Netlify credit limits become restrictive).
3. Use sample/demo media and mock job states initially to validate the interface: reference upload, raw-footage selection, analysis settings, job progress, preview/export screens.
4. Do not send large videos to static-host functions. Do not put API keys or user media in the Git repository.
5. Clearly label the first hosted build as a UI prototype. Real rendering remains unavailable until a compatible backend is provisioned.
6. For real end-to-end testing at $0, run the OpenKatana engine on the user's own computer and expose a temporary authenticated tunnel only if the user explicitly approves. This is a development bridge, not production hosting.

## Phase 2: real hosted rendering

When a small paid budget is approved, provision a dedicated Linux x86-64 VPS sized from representative render benchmarks. Follow `deploy/README.md` exactly: Docker, gVisor, Caddy/HTTPS, separate web and worker users, persistent storage, invitations/authentication, quotas, backups, monitoring and security review. Start CPU-only; add isolated GPU/model services only after the actual workload requires them.

## Free platform notes (checked 2026-11-13)

- Netlify Free currently provides 300 usage credits/month; production deploys, bandwidth, requests and compute consume credits. Keep auto-recharge off.
- Cloudflare Pages Free supports static deployments, but individual static assets are limited to 25 MiB. Cloudflare Workers Free has request and CPU limits that make it unsuitable for video rendering.
- Re-check platform pricing and limits before deployment; they can change.

## Acceptance criteria for the prototype

- Mobile and desktop layouts work; Arabic RTL is correct.
- Upload controls validate file type/size locally and show clear limits.
- The reference-analysis and render actions are visibly marked as demo/mock until connected to a real backend.
- No credentials, private media, or real user data are committed.
- README and UI do not promise online rendering until an end-to-end hosted render passes.
