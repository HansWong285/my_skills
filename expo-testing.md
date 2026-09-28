---
audience: both
read-when: [writing tests, setting up test tooling, fixing flaky tests]
canonical-for: [testing-strategy, e2e-flows]
updated: 2026-09-28
applies-to: Expo SDK 57
---

# Expo Testing Strategy

A three-layer pyramid where each layer owns a different question. Keep the layers honest:
if a test can live in a cheaper layer, move it down.

| Layer            | Tool                | Owns                                             |
| ---------------- | ------------------- | ------------------------------------------------ |
| Pure logic       | Vitest              | Selectors, validators, formatting, API mapping   |
| Components       | Jest + RNTL         | Interaction logic, a11y wiring, state rendering  |
| End-to-end       | Maestro             | Real flows on a real build (onboarding, money)   |

CI wiring and gate ordering: [expo-scaffold.md](expo-scaffold.md#ci-gates).

## 1. Pure logic — Vitest

- Tests live next to the module (`foo.ts` → `foo.test.ts`); no RN transform needed, so
  the suite stays fast (milliseconds) and runs everywhere.
- Keep logic RN-free by design: extract selectors/formatting/validators into
  `features/<domain>/` so they are testable without rendering.
- Mock at module boundaries (`vi.mock('./device')`), never deep inside the unit.
- Deterministic inputs: inject clocks/random or use fake timers — no `Date.now()` in
  assertions.

## 2. Component tests — Jest + RNTL

- Add this layer when interaction logic justifies it (form state machines, conditional
  rendering, a11y states) — not to re-test selectors.
- Query by role/label first, `testID` second; assert on user-visible outcomes, not
  component internals.
- No snapshot sprawl: snapshots only for stable, small, intentional structures.
- Every interactive element carries an accessibility label/state here — the same props
  Maestro and screen readers rely on ([expo-app-quality.md](expo-app-quality.md#accessibility)).

## 3. End-to-end — Maestro

- Flows live in `.maestro/`; reusable journeys in `subflows/` (e.g. sign-in) invoked via
  `runFlow`.
- **Selectors are `testID`s** (`id:` in flows) — never localized copy. Interactive
  primitives accept `testID`; add stable ids when a flow needs a new element.
- Run against a **preview/production build** (no Metro, no dev server) with mock or
  seeded data; `launchApp: clearState: true` for isolation.
- `hideKeyboard` after text entry before tapping buttons that the keyboard may cover.
- Scripts: `npm run e2e` (all flows) and a fast `e2e:smoke` (launch + one assertion).
- CI is optional at first: `workflow_dispatch`/nightly with an emulator beats a slow
  gate on every PR.

## 4. Coverage

- v8 provider with thresholds that **only ratchet up**; never lower a threshold to land
  a change.
- Scope coverage to the layer the runner owns (pure logic) — UI surfaces are covered by
  component/E2E layers, not by inflating the unit number.
- Exclude generated files and bootstrap entry points; do not exclude hard-to-test code
  to make the number look good — move it into a testable module instead.

## 5. Fixtures & factories

- One source of test data: factories/builders with sensible defaults and per-test
  overrides (`makeShift({ state: 'COMPLETED' })`), never scattered literals.
- Shared fixtures live next to the domain; mock data used by the app UI is a fixture
  too — keep it realistic and stable.

## 6. Flaky-test policy

- A flake is a bug: fix it or quarantine it in the same PR — never paper over it with
  retries.
- No retry-on-failure in CI as a default; deterministic clocks, seeded randomness, and
  explicit waits (assert on state, not on time) prevent most flakes.
- Track quarantined tests in the issue tracker with an owner; an empty quarantine list
  is the goal.

## 7. Definition of done

- [ ] New logic has a pure-logic test; bug fixes add a regression test
- [ ] New interactive element has a `testID` when an E2E flow touches it
- [ ] `npm test` + `npm run test:coverage` green; thresholds unchanged or raised
- [ ] One smoke E2E flow still passes against a preview build
- [ ] No new quarantined tests without an owner and issue link
