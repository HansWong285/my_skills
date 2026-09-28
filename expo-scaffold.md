---
audience: both
read-when: [starting an expo project, choosing repo structure, wiring the api contract]
canonical-for: [expo-bootstrap, repo-structure, contract-first-api]
updated: 2026-09-28
applies-to: Expo SDK 57
---

# Professional Expo (React Native) Scaffold

Bootstrap an Expo app that is production-grade from day one: single sources of truth,
CI-enforced gates, reproducible builds. This playbook covers structure, design tokens,
the API contract, and CI. Companions:

| Concern                          | Playbook                                     |
| -------------------------------- | -------------------------------------------- |
| Tests, coverage, E2E             | [expo-testing.md](expo-testing.md)           |
| Accessibility, i18n, UX states   | [expo-app-quality.md](expo-app-quality.md)   |
| Releases, stores, monitoring ops | [expo-release-ops.md](expo-release-ops.md)   |
| Docs architecture, agent files   | [docs-system-scaffold.md](docs-system-scaffold.md), [agentic-ai-scaffold.md](agentic-ai-scaffold.md) |

## 0. Decide first

- Single app or monorepo (monorepo → §1 workspaces; otherwise skip).
- Contract source of truth: OpenAPI spec in this repo, or pulled from the API repo.
- Release channels: EAS build; optional OTA (see [expo-release-ops.md](expo-release-ops.md)).
- Who owns product/design docs vs code (see [docs-system-scaffold.md](docs-system-scaffold.md)).

## 1. Bootstrap & structure

```sh
nvm use 22 && node -v > .nvmrc          # pin Node LTS
npx create-expo-app@latest mobile --template blank-typescript
npx expo install expo-router react-native-safe-area-context react-native-screens
```

```
apps/mobile/
  app.config.ts            # dynamic config; version single-sourced from package.json
  eas.json                 # build/submit profiles (see expo-release-ops.md)
  src/app/                 # expo-router routes only (thin)
  src/components/          # app-level composites
  src/features/<domain>/   # logic, selectors, mock data (unit-testable)
  src/lib/api/             # client, config, errors, session, device identity
  src/lib/observability/   # monitoring + error boundary
  src/i18n/                # typed keys, parity test
  src/theme/               # design tokens (or packages/ui)
packages/{ui,types,contract}     # monorepo only
contract/openapi/v1.yaml         # authored spec
.maestro/                        # E2E flows (see expo-testing.md)
scripts/                         # docs/contract/version checks
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
- Design docs are chapters with front-matter, indexed from one entry file — pattern in
  [docs-system-scaffold.md](docs-system-scaffold.md).

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
- UX states and retry behavior: [expo-app-quality.md](expo-app-quality.md#ux-states).

## 4. Quality gates

- ESLint (expo config) + Prettier (+ Tailwind class sorting); `.prettierignore` for
  generated and human-owned files; `format:check` enforced in CI.
- Docs check script — links, anchors, front-matter, index coverage; spec in
  [docs-system-scaffold.md](docs-system-scaffold.md#docs-check). Reference
  implementation: `scripts/docs-check.mjs` in this repo.
- Tests, coverage thresholds, and E2E: [expo-testing.md](expo-testing.md).

<a id="ci-gates"></a>

## 5. CI & dependency automation

- One CI job: typecheck → lint → format:check → test:coverage → docs:check →
  contract lint + drift + version → `npm audit --omit=dev --audit-level=high`.
- Node from `.nvmrc`, `npm ci`, npm cache enabled.
- Dependabot: grouped weekly PRs (prod/dev, minor+patch); ignore SDK-family majors
  (upgraded as a unit); GitHub Actions ecosystem too.
- PR template listing the gates + compliance reminders; protect `main`, require CI.
  Template: [`templates/pull_request_template.md`](templates/pull_request_template.md).

## 6. Definition of done

- [ ] Fresh clone: `npm ci` + app runs; `.nvmrc` respected
- [ ] typecheck · lint · format:check · test:coverage green locally and in CI
- [ ] contract drift + version gates in CI; mock server serves examples
- [ ] `.env.example` present; no secrets in the repo
- [ ] README/CONTRIBUTING present; PR template + branch protection on
- [ ] Dependabot configured; audit gate green
- [ ] agent files in place — [agentic-ai-scaffold.md](agentic-ai-scaffold.md#definition-of-done)

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
