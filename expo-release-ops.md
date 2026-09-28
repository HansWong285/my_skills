---
audience: both
read-when: [releasing, configuring eas, submitting to stores, setting up alerts]
canonical-for: [release-engineering, store-readiness, monitoring-ops]
updated: 2026-09-28
applies-to: Expo SDK 57
---

# Expo Release & Ops

Ship, roll back, and watch it — without guessing. Build profiles assume EAS; OTA assumes
`expo-updates` (optional). CI gates that run before any build:
[expo-scaffold.md](expo-scaffold.md#ci-gates).

## 1. Versioning

- App version is **single-sourced** from `package.json`, read by `app.config.ts` — no
  duplicated `app.json`.
- Semver for the user-visible version; build numbers (`ios.buildNumber`,
  `android.versionCode`) auto-increment via EAS (`appVersionSource: remote` +
  `autoIncrement`).
- Tag convention: `vX.Y.Z` for the app; use a distinct prefix (e.g. `contract-vX.Y.Z`)
  for published shared packages. Document both in CONTRIBUTING.
- `CHANGELOG.md` (Keep a Changelog) updated in the release PR, not after the tag.

## 2. EAS profiles

```json
{
  "cli": { "version": ">= 24.0.0", "appVersionSource": "remote" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": { "autoIncrement": true }
  },
  "submit": { "production": {} }
}
```

- `development` for dev clients, `preview` for QA/E2E installs, `production` for stores.
- Credentials live in EAS (never in the repo); `EXPO_TOKEN` in CI only.

## 3. Release workflow

Tag-driven, in this order:

1. Verify tag == `package.json` version (fail fast on mismatch).
2. Run the full gate suite (typecheck, lint, format, tests + coverage, docs, contract).
3. `eas build --profile production --platform all --non-interactive`.
4. Submit with `eas submit`; publish the changelog as the release notes.

Publish shared packages (contract/types) in a separate job keyed to their own tag prefix,
with a registry token scoped to that package only.

## 4. OTA updates (optional)

- Enable `expo-updates` with channels per profile; `runtimeVersion` policy: `fingerprint`
  (or a manual runtime) so native changes never ship as OTA.
- **Never OTA native changes** — JS-only fixes and copy changes only.
- Rollback = republish the previous bundle to the channel; keep the last known-good
  bundle id noted in the release checklist.

## 5. Store readiness

- Assets: icon, adaptive icon (foreground/background/monochrome), splash/launch screen,
  screenshots per required size — versioned in the repo.
- Metadata: name, subtitle, description, keywords, support URL, privacy policy URL.
- Apple: privacy nutrition labels; Google: data safety form. Both must match what the
  app actually collects (see monitoring scrubbing in §7).
- Submit early to catch review issues; budget review time before any announced date.
- Staged rollout: 10% → 50% → 100% for production, watching crash-free rate between
  steps.

## 6. Rollback & incident

- Store rollback is not instant: prepare a forward-fix or OTA rollback path instead.
- Keep server-side **kill switches** (remote flags) for risky features — the only truly
  instant rollback.
- Incident loop: detect (alerts) → mitigate (flag/OTA) → fix → postmortem with a dated
  entry in the decision log ([docs-system-scaffold.md](docs-system-scaffold.md#decision-log)).

<a id="monitoring-ops"></a>

## 7. Monitoring ops

- Client monitoring is a no-op until `EXPO_PUBLIC_SENTRY_DSN` is set; build-time
  `SENTRY_ORG`/`SENTRY_PROJECT` + `SENTRY_AUTH_TOKEN` (EAS env/secret) upload source maps.
- **Scrub PII before sending** — explicit sensitive-key list, extended whenever a new
  sensitive field appears; `sendDefaultPii: false`; no user identifiers beyond an opaque
  internal id.
- Alerts that matter: crash-free session rate below target, new-issue spike after a
  release, and error-rate regression on a core flow. Route them somewhere a human reads.
- Track release health per version; a release that regresses crash-free rate is a
  rollback candidate, not a wait-and-see.
- Watch event volume/quota; sampling rates are a budget, not a default.

## 8. Definition of done

- [ ] `app.config.ts` version single-sourced; `eas.json` profiles committed
- [ ] Release workflow verifies tag == version before building
- [ ] OTA (if enabled) cannot ship native changes; rollback path documented
- [ ] Store assets + metadata + privacy forms match actual data collection
- [ ] Staged rollout plan and crash-free target agreed
- [ ] Alerts configured and routed; scrubbing covered by a test
- [ ] CHANGELOG entry merged before the tag is pushed
