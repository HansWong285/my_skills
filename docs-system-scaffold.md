---
audience: both
read-when: [writing docs, structuring docs, setting documentation rules]
canonical-for: [documentation-architecture, front-matter, docs-check]
updated: 2026-09-28
applies-to: any repo
---

# Documentation System Scaffold

Documentation that stays true as the code moves: one home per fact, layered by audience,
and checked by CI. Two tiers — start Light, upgrade to Full when the project earns it.

## 0. Tiers

**Light** (default for solo/small projects):

- `README.md` (setup, run, checks), `CONTRIBUTING.md`, an `adr/` folder for decisions,
  and design tokens as code.

**Full** (upgrade when the signals appear):

- Product master doc + reference shelf, a design system entry file with chapters,
  front-matter on every chapter, size budgets, and a docs check in CI.

Upgrade signals: README > 300 lines; the same fact appears in two places; agents
re-derive context every session; someone asks "where is this decision written down?".

## 1. Three layers & ownership

| Layer          | Answers                        | Typical files                    | Owner          |
| -------------- | ------------------------------ | -------------------------------- | -------------- |
| Product master | why / what / scope / decisions | `GUIDELINE.md` + reference shelf | **human**      |
| Visual system  | how it looks and speaks        | `DESIGN.md` + `design/*`         | agent-editable |
| Engineering    | how to build and verify        | `AGENTS.md` + `CONTRIBUTING.md`  | agent-editable |

Ownership rule: on human-owned files, agents propose **exact wording** and wait for
confirmation — they never rewrite decisions silently.

## 2. Layout, entry points, read-when

Each layer has exactly **one entry point** with a read-when table; chapters are pulled on
demand (3–8 KB) instead of reading the whole set (tens of KB). Example:

| When                        | Read                     |
| --------------------------- | ------------------------ |
| Any colour/token decision   | `design/02-color.md`     |
| Building or changing a card | `design/06-components/*` |
| Reviewing violations        | `design/09-anti-patterns.md` |

Chapter files are numbered (`01-`, `02-`) for stable ordering; entry files link to paths,
never to section numbers.

<a id="front-matter"></a>

## 3. Front-matter & anchors

Every chapter and entry file starts with:

```yaml
---
audience: human | agent | both
read-when: [<trigger>, ...]
canonical-for: [<topic>, ...]
updated: YYYY-MM-DD
applies-to: <optional: version/stack scope>
---
```

- `canonical-for` declares what this file is the single home for — two files claiming the
  same topic is a bug.
- Anchors are stable: use explicit `<a id="...">` before sections other files link to.
- Cross-reference as `path/to/file.md#anchor`. **Never cite section numbers across
  files** — they renumber, anchors do not.

<a id="size-budgets"></a>

## 4. Size budgets

- ~200 lines per file. Exceed it → split by family or section, don't append.
- One canonical statement per fact; every other mention is a pointer.
- Moving content leaves a stub: `> Moved to path — number kept for stable references.`

<a id="decision-log"></a>

## 5. Decision log & open items

- Decisions: append-only, dated, newest first; never edit history — supersede it.
- Open questions: stable numbers, closed by status change (no inline strikethrough).
- ADR template for standalone repos: [`templates/adr.md`](templates/adr.md).

<a id="docs-check"></a>

## 6. docs:check

A dependency-free script run in CI. Generic checks (worth having everywhere):

1. Markdown link targets and `#anchors` resolve.
2. Required front-matter keys are present on doc files.
3. Every doc is reachable from the index (no orphans).
4. Forbidden stale-reference patterns (e.g. `FILE.md §`) are absent.

Project-specific checks (add when they apply):

5. **ID vocabulary** — every referenced ID (`F-###`, `REQ-###`) is defined exactly once.
6. **Token drift** — design values documented in docs match the code source of truth
   (colors, type tiers, spacing, radii vs the theme module).

Script shape: walk `*.md` (skip `node_modules`, `.git`, build dirs), collect errors with
`file:line — message`, print them all, exit non-zero. Wire it as one CI step. Reference
implementation: [`scripts/docs-check.mjs`](scripts/docs-check.mjs).

Anchors: explicit `<a id>` is the safest. Heading slugs work for ASCII headings — note
that GitHub slugification differs for non-ASCII (CJK) headings, which need explicit ids.

## 7. ID vocabulary

- One namespace for requirements/features (`F-###`, `REQ-###`), defined in exactly one
  file.
- Used in docs, commit messages, and PR titles so reviewers can trace intent.
- Retired IDs are never reused; gaps are fine.

## 8. Anti-patterns

- Duplicated facts across files (two sources drift; the wrong one gets read).
- Section-number citations across files.
- Docs that disagree with code (commands, tokens, version numbers) — enforce with a
  check or delete the doc.
- One giant doc nobody reads; agents re-derive everything each session.
- Agent-editable product decisions.
- Critical info only in tooltips/on hover — see
  [expo-app-quality.md](expo-app-quality.md#accessibility).

## 9. Definition of done

- [ ] One entry point per layer, each with a read-when table
- [ ] Front-matter on every doc file; no topic claimed by two files
- [ ] Files within ~200 lines; splits leave stable stubs
- [ ] Decisions append-only; open items numbered
- [ ] docs check wired into CI and green
- [ ] Human-owned vs agent-editable stated in the engineering docs
