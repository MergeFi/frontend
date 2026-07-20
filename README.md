# MergeFi Frontend

**Where Open Source Meets Finance — Merge code. Earn instantly.**

This is the web client for **MergeFi**, a platform where sponsors fund open-source
work, maintainers turn GitHub issues into paid bounties, contributors complete
them, and [Soroban](https://developers.stellar.org/docs/build/smart-contracts)
smart contracts on the Stellar network hold funds in escrow and release
payment automatically the moment a pull request is merged.

GitHub remains the source of truth for code. Stellar/Soroban handles the
financial layer. This repo is the Next.js frontend that ties both together for
contributors, maintainers, and sponsors.

Related repositories:
- [`mergefi/backend`](https://github.com/MergeFi/backend) — NestJS API: GitHub sync, webhooks, bounty/escrow orchestration, reputation, analytics.
- [`mergefi/contracts`](https://github.com/MergeFi/contracts) — Soroban smart contracts: escrow, milestone funding, maintenance pools, team splits.
- 
<img width="1920" height="1200" alt="image" src="https://github.com/user-attachments/assets/c019b457-90a0-4f2e-94d9-ab927de326dd" />

## Why Stellar and Soroban?

- Very low transaction costs make micro-bounties (a $5 doc fix, a $20 bug fix) economically practical.
- Fast settlement means contributors get paid in minutes, not weeks.
- Soroban smart contracts implement escrow, payment release, refunds, and split logic natively on-chain, so no one — including MergeFi — can touch funds outside the rules encoded in the contract.

## Core users

| Role | What they do |
|---|---|
| **Contributors** | Discover paid issues, build a public reputation, earn USDC/XLM, track earnings. |
| **Maintainers** | Create projects, attach rewards to issues, approve completed work, manage permissions. |
| **Sponsors** | Fund repositories or specific issues/milestones, track spend, measure impact. |

<img width="1920" height="1200" alt="image" src="https://github.com/user-attachments/assets/cb9a65c7-4c09-44a1-8d9b-b912a4ffe179" />

## Feature map → routes

| Feature | Route |
|---|---|
| Landing page / product pitch | `/` |
| Browse paid issues (bounties) | `/issues` |
| Bounty detail, escrow status, claim flow | `/issues/[id]` |
| Milestone funding + recurring maintenance pools | `/milestones` |
| Connect GitHub + Stellar wallet (Freighter) | `/connect` |
| Contributor dashboard (earnings, claims, recommendations) | `/dashboard/contributor` |
| Maintainer dashboard (bounty pipeline, PRs awaiting merge) | `/dashboard/maintainer` |
| Sponsor dashboard (spend, active bounties, budget remaining) | `/dashboard/sponsor` |
| Public reputation profile | `/reputation/[handle]` |

## Architecture

```
Next.js (App Router)                 this repo
  ├─ Server Components fetch data ── mergefi-backend REST API
  │                                    (falls back to realistic mock data
  │                                     when the backend isn't running,
  │                                     so the UI is always demoable)
  └─ Client components (/connect) ── GitHub OAuth redirect (backend-issued)
                                   └─ Freighter wallet extension
                                        (@stellar/freighter-api)
```

- **Framework**: Next.js 16 (App Router, React 19, TypeScript, Turbopack).
- **Styling**: Tailwind CSS v4, dark-mode-first design system (`slate`/`emerald` palette).
- **Data fetching**: Server Components call the backend via `src/lib/api.ts#fetchWithFallback`, which tries the live API and falls back to `src/lib/mock-data.ts` if it's unreachable — the app is fully browsable without the backend running.
- **Wallet integration**: `src/lib/wallet.ts` wraps `@stellar/freighter-api` for connecting a Stellar wallet and signing transactions (escrow funding, milestone deposits) client-side.
- **GitHub auth**: The "Connect GitHub" button redirects to the backend's OAuth endpoint (`NEXT_PUBLIC_API_URL/auth/github`); the frontend itself holds no GitHub credentials.

### Directory layout

```
src/
  app/                 App Router routes (one folder per route above)
  components/
    ui/                Button, Badge, StatCard — small reusable primitives
    layout/            Navbar, Footer
    bounty/            BountyCard
  lib/
    api.ts             fetch wrapper + mock-data fallback
    config.ts           env-driven API base URL, OAuth URL, Stellar network
    mock-data.ts        realistic sample bounties/milestones/profiles for demos
    utils.ts            cn(), currency/percent/date formatting
    wallet.ts            Freighter connect/sign helpers
  types/
    index.ts             shared domain types (Bounty, Milestone, ReputationProfile, ...)
```

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With no backend running,
every page renders against the bundled mock data in `src/lib/mock-data.ts` —
useful for frontend-only development or a quick demo. Point
`NEXT_PUBLIC_API_URL` at a running `mergefi-backend` instance to see live data.

### Environment variables

Both variables are validated at build time (`next.config.ts` / `src/lib/env.ts`, #26) — an unset or invalid value fails `next build`/`next dev`/`next start` immediately with a clear error, rather than silently falling back and only surfacing as a confusing on-chain failure later. `.env.example` sets both explicitly, so the quickstart above needs no manual edits.

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the `mergefi-backend` API. Must be a well-formed URL. | `http://localhost:4000/api` |
| `NEXT_PUBLIC_STELLAR_NETWORK` | Must be exactly `TESTNET` or `PUBLIC` (case-sensitive) — selects the Freighter network passphrase used to sign transactions. | **None.** Network selection is too consequential to guess a default for — the wrong value signs transactions with the wrong passphrase. Set it explicitly (`.env.example` does this for local dev). |

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config, `eslint-config-next`) |
| `npm run verify:headers` | Boots the production build and asserts security headers are present on real responses (run `npm run build` first) |

## Security headers

`next.config.ts` sets these on every route, verified in CI via `npm run verify:headers`:

| Header | Value | Why |
|---|---|---|
| `X-Frame-Options` | `DENY` | No legitimate iframe-embedding use case exists in this app, and fund/claim actions are one click away — clickjacking is a real risk here. Relax to a scoped CSP `frame-ancestors` allowlist if a real embed need ever comes up. |
| `X-Content-Type-Options` | `nosniff` | Stops the browser from MIME-sniffing a response into an executable content type. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | The GitHub OAuth callback (`/auth/callback`) carries a short-lived token in its query string; this keeps the full URL out of the `Referer` header on cross-origin requests. |
| `Strict-Transport-Security` | `max-age=86400` | Deliberately conservative to start (no `includeSubDomains`, no `preload`) — HSTS is effectively irreversible once cached by a browser. Raise `max-age` and add `includeSubDomains` after a stable production run, and only add `preload` once that's stable too. |

`Content-Security-Policy` is intentionally not set here — it's tracked separately so it can compose correctly with the theme-init inline script in `layout.tsx` rather than this change guessing at a nonce/hash strategy.

None of these headers affect the Freighter wallet bridge or the GitHub OAuth flow: Freighter communicates via an injected browser-extension content script (`@stellar/freighter-api`), which framing/MIME/referrer/transport headers have no bearing on, and the OAuth `fetch` calls to the backend are unaffected since these headers only change what's *disclosed*, not whether a request succeeds.

## Example user journey

1. A maintainer connects a GitHub repository from `/connect`.
2. From their dashboard, they mark an issue with a **100 USDC** reward.
3. A sponsor funds the bounty from `/dashboard/sponsor` — the backend locks the funds in a Soroban escrow contract.
4. A contributor browses `/issues`, claims the bounty, and opens a pull request.
5. The maintainer reviews and merges it on GitHub.
6. The backend detects the merge via a GitHub webhook and calls the escrow contract's release function.
7. The contributor is paid on-chain within minutes, and their `/reputation/[handle]` profile updates.

## Roadmap

- Wire the contributor/maintainer dashboards to authenticated sessions instead of a hardcoded demo handle.
- Real-time bounty/escrow status via websockets or polling once the backend emits webhook-driven events.
- AI-powered issue recommendations based on a contributor's language/repo history.
- Organization verification badges and cross-repository reputation aggregation.
