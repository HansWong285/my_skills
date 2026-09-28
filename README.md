---
audience: both
read-when: [browsing skills, adding a skill]
canonical-for: [skill-index]
updated: 2026-09-28
---

# my_skills

Reusable engineering playbooks — opinionated, checklist-driven, and kept honest by a docs check.
Each playbook is self-contained, under ~200 lines, and never restates rules that live in another
playbook (one fact, one home — link instead).

| Skill                                                | What it covers                                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [expo-scaffold.md](expo-scaffold.md)                 | Bootstrap a production-grade Expo app: structure, design system, contract-first API, gates, CI.     |
| [expo-testing.md](expo-testing.md)                   | Test pyramid per layer: vitest, component tests, Maestro E2E, coverage, fixtures, flaky policy.     |
| [expo-app-quality.md](expo-app-quality.md)           | Accessibility, i18n, loading/empty/error/offline states, performance budgets.                       |
| [expo-release-ops.md](expo-release-ops.md)           | Versioning, EAS builds, OTA, store readiness, rollback, monitoring ops.                             |
| [agentic-ai-scaffold.md](agentic-ai-scaffold.md)     | Make a repo agent-ready: AGENTS.md, tool stubs, MCP, skills, guardrails.                            |
| [docs-system-scaffold.md](docs-system-scaffold.md)   | Documentation architecture: Light→Full tiers, front-matter, decision log, docs check.               |

Starter files live in [`templates/`](templates/README.md) — copy them into a new repo and adapt.

## Adding a skill

1. Create `kebab-case-name.md` at the repo root with the required front-matter:

   ```yaml
   ---
   audience: both
   read-when: [<trigger>]
   canonical-for: [<topic>]
   updated: YYYY-MM-DD
   ---
   ```

2. Add a row to the index table above.
3. Run the checker — `node scripts/docs-check.mjs` (also runs in CI) — and fix what it reports.
4. Keep it under ~200 lines; split by concern when it grows (see
   [docs-system-scaffold.md](docs-system-scaffold.md) for the size-budget rule).

## Conventions

- **One fact, one home.** Cross-reference with `file.md#anchor`; never copy paragraphs between
  playbooks.
- **Anchors are stable.** Prefer explicit `<a id="...">` before sections other files link to.
- **Checklists are the product.** Every playbook ends with a copy-paste definition of done.

## License

MIT — see [LICENSE](LICENSE).
