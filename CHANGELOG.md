# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Root `.editorconfig` enforcing UTF-8, LF line endings, and 2-space indentation across all editors (#478).
- `Permissions-Policy` security header (`camera=(), microphone=(), geolocation=(), payment=()`) in `next.config.ts` (#479).
- Test-time deterministic stubs for `NEXT_PUBLIC_STELLAR_NETWORK` and `NEXT_PUBLIC_API_URL` in `jest.setup.ts` (#474).
- Supply chain security hardening pinning GitHub Actions in CI to immutable commit SHAs (#475).

### Changed
- Refactored `ClaimButton` and `ContributorDashboardClient` to clean up unused React imports and types (#473).
- Hardened `formatCurrency` utility and aligned `StatCard` usage across dashboard metrics.
- Updated `browserslist` definitions to eliminate high-severity dependency audit findings.

### Fixed
- Fixed uncaught promise rejections and unhandled async handlers across button click bindings (#481, #482).
- Resolved race-condition handling in contributor claiming flow.
- Added missing `ts-node` development dependency for native TypeScript Jest configuration.
