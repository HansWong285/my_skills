---
audience: both
read-when: [building ui, reviewing ux, adding copy, adding user-facing text]
canonical-for: [accessibility, i18n, ux-states, performance-budgets]
updated: 2026-09-28
applies-to: Expo SDK 57
---

# Expo App Quality

Four concerns that decide whether an app feels professional to use: accessibility,
localization, state handling, and performance. Design tokens and components:
[expo-scaffold.md](expo-scaffold.md#2-design-system).

<a id="accessibility"></a>

## 1. Accessibility

- Every interactive element has an `accessibilityRole` and a label
  (`accessibilityLabel` when the visible text is not descriptive). Disabled and checked
  states go through `accessibilityState`, never color alone.
- Minimum touch target 44×44 pt (iOS) / 48×48 dp (Android); pad the pressable, not the
  icon.
- Support dynamic type: no fixed heights on text containers, allow font scaling, test at
  the largest system size.
- Contrast: text and meaningful icons meet WCAG AA against their surface token; never
  encode status by color only (pair with label/icon).
- **Never hide critical information behind tooltips or hover** — money, fees, deadlines,
  and compliance details are always visible in the layout.
- `testID` is for tests; it is not an accessibility label. Provide both where needed.
- Smoke test each release with a screen reader (VoiceOver/TalkBack) on the core flow.

<a id="i18n"></a>

## 2. Internationalization

- Typed translation keys from day one; a **locale parity test** fails CI when one locale
  is missing keys the other has.
- Detect locale at runtime; never hardcode a language or format. No string concatenation
  for sentences — use interpolation and plural rules.
- Format dates, numbers, and currency with `Intl` (or a locale-aware formatter) — never
  manual string building.
- Layout for RTL from the start: logical properties (`start`/`end`), mirrored icons where
  direction matters, and a pseudolocale pass to catch truncation.
- Copy and status terms come from the voice/terminology doc, not from developers —
  keep one canonical term per concept (see [docs-system-scaffold.md](docs-system-scaffold.md)).
- Translation workflow: keys ship with English + one more locale; adding a language is a
  data change, not a code change.

<a id="ux-states"></a>

## 3. UX states

Every data surface defines all four states before it ships:

| State    | Rule                                                                       |
| -------- | -------------------------------------------------------------------------- |
| Loading  | Skeletons for known layouts; spinner only for short, layout-unknown waits  |
| Empty    | Explain why it is empty and what to do next; never a blank screen          |
| Error    | Actionable message + retry; map API `code`s to i18n copy, never raw errors |
| Offline  | Detect and say so; queue safe writes or disable with a reason              |

- Prefer disabled-with-reason over hidden actions; a disappearing button is a bug report.
- Retry with backoff for transient failures; never hammer on a 4xx — those are user or
  client problems, not transient.
- Keep the last good data visible while refreshing instead of flashing empty states.

<a id="performance-budgets"></a>

## 4. Performance budgets

- **Bundle budget in CI**: record the release bundle size and fail on a regression above
  the agreed threshold. Know the cost of every dependency before adding it (an error
  monitoring SDK alone can add >1 MB).
- Measure on release builds only — dev builds lie.
- Lists: virtualize long lists, stable keys, avoid inline object/function props that
  defeat memoization.
- Images/assets: size to the largest rendered dimension, prefer vector/`expo-image` with
  caching; audit font subsets (subset fonts to the glyphs you ship).
- Startup: keep the root tree shallow; defer non-critical work (analytics init, PDF
  tooling) until after first paint or until used.
- Re-check budgets each release; a budget nobody measures is a wish.

## 5. Definition of done

- [ ] All interactive elements labelled; screen-reader smoke pass on the core flow
- [ ] Largest dynamic-type size does not clip or overlap
- [ ] Locale parity test green; no hardcoded strings in components
- [ ] Dates/numbers/currency formatted via `Intl`
- [ ] Loading/empty/error/offline states exist for every data surface
- [ ] Bundle size recorded; no regression beyond the budget
- [ ] Critical info (fees, deadlines, compliance) never hidden behind interaction
