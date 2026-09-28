# Professional Expo (React Native) Scaffold

Opinionated checklist to bootstrap an Expo app that is production-grade from day one:
single sources of truth, CI-enforced gates, reproducible builds, traceable releases,
privacy-safe monitoring. Stack: Expo SDK (pinned) + expo-router + TypeScript strict +
NativeWind + npm workspaces + contract-first API + Prism + Sentry + Maestro.

## 0. Decide first

- Single app or monorepo (monorepo → §1 workspaces; otherwise skip).
- Package manager: npm workspaces (default here).
- Contract source of truth: OpenAPI spec in this repo, or pulled from the API repo.
- Release channels: EAS build; optional expo-updates OTA.

## 1. Bootstrap & structure

```sh
nvm use 22 && node -v > .nvmrc          # pin Node LTS
npx create-expo-app@latest mobile --template blank-typescript
npx expo install expo-router react-native-safe-area-context react-native-screens
```

```
apps/mobile/
  app.config.ts            # dynamic config; version single-sourced from package.json
  eas.json                 # build/submit profiles
  src/app/                 # expo-router routes only (thin)
  src/components/          # app-level composites
  src/features/<domain>/   # logic, selectors, mock data (unit-testable)
  src/lib/api/             # client, config, errors, session, device identity
  src/lib/observability/   # monitoring + error boundary
  src/i18n/                # typed keys, parity test
  src/theme/               # design tokens (or packages/ui)
packages/{ui,types,contract}     # monorepo only
contract/openapi/v1.yaml         # authored spec
.maestro/                        # E2E flows
scripts/                         # docs/contract/font/version checks
```

Rules:

- `tsconfig.base.json` with `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `isolatedModules`; app extends it + `expo/tsconfig.base`; path alias `@/*`.
- Routes stay thin — logic lives in `features/` so it is testable without RN.
- Feature flags module (`src/features/config/flags.ts`) to gate unfinished work instead
  of long-lived branches.
- Repo hygiene from commit #1: `.gitignore`, `.editorconfig`, `.gitattributes`
  (LF normalization, binary guards, `linguist-generated` for generated files).

## 2. Design system

- Tokens as code — colors / spacing / radius / type scale in one module; generate the
  Tailwind theme and CSS vars from it. No hardcoded hex or off-scale sizes in components.
- Component-first: extend the design system before inventing one-off styling.
- NativeWind: `withNativeWind(config, { inlineRem: 16 })` keeps web/native geometry
  identical; restart Metro with `npx expo start -c` after adding new dirs or classes.

## 3. Contract-first API & types

- Author `contract/openapi/v1.yaml`; generate types (`openapi-typescript`) into a
  dedicated package; **never hand-edit generated files**.
- CI drift gate: regenerate + `git diff --exit-code`; lint the spec (Redocly);
  version-sync script (spec version == package version).
- Mock API: Prism serving the spec with `components.examples` for deterministic,
  realistic payloads; document `Prefer:` overrides for error states.
- Conventions: money as integer minor units; ISO-8601 UTC timestamps; `YYYY-MM-DD`
  dates; additive-only changes within a major; clients tolerate unknown fields/enum
  values; stable error `code`s mapped to i18n keys.
- Client layer (`src/lib/api/`): `config` (base URL, client-version header),
  `httpRequest` (headers, 204 handling, error parsing, idempotency key), `session`
  (SecureStore), device identity (register once, persist), client-too-old gate that
  renders an update screen instead of crashing.
- `.env.example` with `EXPO_PUBLIC_API_URL` pointing at the mock.

## 4. Quality gates & testing

- Vitest for pure logic (no RN transform needed), tests next to modules; v8 coverage
  with thresholds that only ratchet up.
- Locale parity test (both locales define every key) from day one.
- Component tests (Jest + RNTL) only when UI logic justifies them.
- ESLint (expo config) + Prettier (+ Tailwind class sorting); `.prettierignore` for
  generated and human-owned files; `format:check` enforced in CI.
- Docs lint script (dead links/anchors, unknown IDs, token drift) if docs are layered.

## 5. CI & dependency automation

- One CI job: typecheck → lint → format:check → test:coverage → docs:check →
  contract lint + drift + version → `npm audit --omit=dev --audit-level=high`.
- Node from `.nvmrc`, `npm ci`, npm cache enabled.
- Dependabot: grouped weekly PRs (prod/dev, minor+patch); ignore SDK-family majors
  (upgraded as a unit); GitHub Actions ecosystem too.
- PR template listing the gates + compliance reminders; protect `main`, require CI.

## 6. Release engineering

- `app.config.ts` is dynamic; app version read from `package.json` (no duplicated
  `app.json`).
- `eas.json`: `development` (dev client), `preview` (internal), `production`
  (`autoIncrement`, remote version source).
- Tag-driven release workflow: verify tag == package version → run gates →
  `eas build --profile production --non-interactive` (needs `EXPO_TOKEN`).
- `CHANGELOG.md` (Keep a Changelog) + tag conventions documented in CONTRIBUTING;
  separate tag prefix + publish workflow if a shared contract package is published.
- Optional: expo-updates channels + `runtimeVersion` policy; `eas submit` profile.

## 7. Observability & E2E

- Sentry: `npx expo install @sentry/react-native`; config plugin (org/project from
  env); Metro wrapped as `getSentryExpoConfig(...)` under other config wrappers.
- `src/lib/observability/`: `initMonitoring()` (init once, **no-op without DSN**,
  `sendDefaultPii: false`, environment tag, sampled tracing), `captureError()`, and
  exported scrub helpers (`beforeSend`/`beforeBreadcrumb` redact sensitive keys —
  keep the fragment list explicit and extensible).
- Themed error boundary around the app + `Sentry.wrap(RootLayout)`.
- Env: `EXPO_PUBLIC_SENTRY_DSN` (client) + `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN`
  as EAS env/secret for source maps.
- Cost note: the SDK adds ~1–1.5 MB to the bundle even with no DSN (static import is
  crash-safe; dynamic import keeps DSN-less builds lean — choose consciously).
- Maestro: `.maestro/` flows + reusable `subflows/`; `testID` passthrough on all
  interactive primitives; select by `id:` never localized copy; run against a preview
  build (no dev server needed); scripts `e2e` / `e2e:smoke`; CI optional
  (workflow_dispatch/nightly with an emulator).

## 8. Security & privacy

- No secrets in the repo; `.env.example` templates; build-time secrets via EAS env.
- Tokens/identifiers in SecureStore; never log PII; monitoring scrub list reviewed
  whenever a new sensitive field appears.
- Keep an append-only domain-event log for money/state changes (immutable history).
- Document retention/PII handling before handling personal data.

## 9. Documentation & workflow

- `README.md` — setup, run, mock API, checks, releases.
- `CONTRIBUTING.md` — gates, contract workflow, E2E, monitoring, release/tag flow.
- `AGENTS.md` — agent rules: edit boundaries, conventions, docs map, size budgets.
- One canonical statement per fact; separate human-owned vs agent-editable docs;
  run the docs lint after markdown edits.
- Append-only decision log (dated entries).

## 10. Definition of done

- [ ] Fresh clone: `npm ci` + app runs; `.nvmrc` respected
- [ ] typecheck · lint · format:check · test:coverage green locally and in CI
- [ ] contract drift + version gates in CI; mock server serves examples
- [ ] `app.config.ts` version single-sourced; `eas.json` profiles committed
- [ ] release workflow verifies tag == version before building
- [ ] Sentry no-ops without DSN; scrubbing covered by a test
- [ ] one Maestro smoke flow passes against a preview build
- [ ] README/CONTRIBUTING/CHANGELOG present; PR template + branch protection on
- [ ] Dependabot configured; audit gate green

## Appendix — generic RN/Expo pitfalls

- **NativeWind + Metro:** new component dirs/classes may be missed by the Tailwind
  watcher — restart with `-c` and verify the class exists in the compiled CSS.
- **NativeWind + animated styles:** never put `className` and an animated `transform`
  on the same element (wrap in a className-free `Animated.View`).
- **react-native-web:** `pointerEvents` must be a prop on web; `box-none`/`box-only`
  in inline styles silently does nothing.
- **rem parity:** `inlineRem: 16` so device geometry matches web.
- **Metro monorepo:** SDK 52+ auto-configures; workspace deps as `"*"` with
  `main: src/index.ts`.
- **Versions:** always `npx expo install` for RN/Expo packages — never hand-pick.
