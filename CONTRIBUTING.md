# Contributing to MergeFi Frontend

Welcome, and thank you for contributing to MergeFi! MergeFi bridges open-source development with Stellar/Soroban financial contracts.

This guide outlines our development workflow, contribution lifecycle, and submission standards.

---

## 1. Finding & Claiming an Issue

- Browse open issues tagged with `good first issue`, `help wanted`, or reward campaign labels (`GrantFox OSS`, `Official Campaign | FWC26`, `Stellar Wave`).
- Comment on the issue you wish to claim to express interest and request assignment from maintainers.
- Avoid duplicate work: check existing issue comments and open pull requests before beginning implementation.

---

## 2. Local Development Workflow

### Prerequisites
- Node.js 18+ or 20+
- npm 9+
- A modern browser with Freighter wallet extension (for testing on-chain connect & fund actions)

### Setup
```bash
git clone https://github.com/<your-username>/frontend.git
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000). By default, pages run against realistic mock data in `src/lib/mock-data.ts`, so no active backend is required for UI development.

---

## 3. Testing & Pre-PR Verification Checklist

Before submitting your pull request, ensure all local verification checks pass:

1. **Linting & Code Quality**:
   ```bash
   npm run lint
   ```
   Must pass with 0 errors and 0 warnings.

2. **Unit & Component Tests**:
   ```bash
   npm test
   ```
   All test suites in `src/` must complete cleanly.

3. **Production Build & Environment Validation**:
   ```bash
   npm run build
   npm run verify:headers
   npm run verify:env
   ```
   Ensures Next.js Turbopack build succeeds and all security headers are properly dispatched.

---

## 4. Pull Request Guidelines

- **Branch Naming**: Use descriptive prefixes: `fix/<description>`, `feat/<feature>`, `docs/<topic>`, `refactor/<target>`.
- **Title & Commit Conventions**: Follow conventional commits (e.g. `fix(bounty): resolve precision step in deposit input (#397)`).
- **Link Issues**: Always link the issue your PR resolves in the description: `Fixes #<issue_number>` or `Closes #<issue_number>`.
- **Atomic Changes**: Keep PRs focused on one issue or closely coupled fixes. Avoid bundle PRs touching unrelated modules.

---

## 5. Bounty & Reward Distribution

- MergeFi distributes rewards through Soroban smart contracts on the Stellar network.
- Ensure your GitHub account has your linked Stellar wallet address configured under `/connect` or in your reputation profile (`/reputation/[handle]`).
- When your PR is merged, maintainers trigger contract settlement and reward tokens (USDC or XLM) are disbursed directly to your address.
