# Changelog

All notable changes to the MergeFi frontend application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Supply-chain security hardening by pinning GitHub Actions to immutable commit SHAs (#475).
- `Permissions-Policy` security header restricting unused browser features (#479).
- `.github/CODEOWNERS` repository ownership configuration (#476).
- Code formatting tooling with `.editorconfig`, `.prettierrc`, and formatting npm scripts (#478).
- Out-of-the-box test suite support with `NEXT_PUBLIC_STELLAR_NETWORK` default stub (#474).
- Dedicated error boundaries for `/connect` and `/auth/callback` routes (#468).
- Active-page navigation indicators with `aria-current="page"` in Navbar (#469).
- Accessible `role="status"` and `aria-live="polite"` feedback for auth callback transitions (#470).
- Visible focus rings and `focus-visible` styling on interactive cards and inputs (#466, #467).
- XLM asset support in mock data and documentation (#367).

### Fixed
- Unused ESLint imports across UI components (#473).
- Strict type-safety and unhandled promise/handler rejections (#480, #481, #482).
